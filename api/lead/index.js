/*
 * POST /api/lead — Formulario principal de www.regulatec.cl (Nota de ejecución técnica §4.4 y §4.5).
 *
 * 1. Valida y descarta spam (honeypot, tiempo mínimo, rate limit por IP).
 * 2. Guarda el lead y el registro de consentimiento (texto exacto, versión, fecha/hora, canal)
 *    en Azure Table Storage — almacenamiento persistente y consultable.
 * 3. Notifica por correo vía Microsoft Graph a ventas@ con copia oculta interna (solo servidor).
 *
 * Configuración (Application settings del Static Web App — nunca en el código, el repo es público):
 *   LEAD_TABLE_SAS_URL   URL de la tabla con SAS (permiso Add), ej. https://<cuenta>.table.core.windows.net/leads?sv=...
 *   GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET   App Registration con Mail.Send (aplicación)
 *   MAIL_SENDER          buzón desde el que se envía (ej. noreply@regulatec.cl)
 *   MAIL_TO              destinatario operativo (por defecto ventas@regulatec.cl)
 *   MAIL_BCC             copia oculta interna (opcional)
 *   AUTORESPUESTA_ACTIVA "true" para enviar acuse al visitante (texto pendiente de aprobación)
 */
const crypto = require('crypto');

const { limpiar, ipDe, excedeLimite, guardarEnTabla, tokenGraph, enviarCorreo, tablaHtml } = require('../shared/comun');

const LIMITE_POR_IP = 5;
const TIEMPO_MINIMO_MS = 3000;

const CAMPOS_TEXTO = {
  contacto: 120, organizacion: 160, email: 160, cargo: 80, frente_interes: 80, telefono: 40,
  version_texto_consentimiento: 120, texto_consentimiento_respuesta: 600, texto_consentimiento_marketing: 600,
  fuente: 40, canal: 60, pagina_origen: 200, pagina_entrada: 200, referrer: 300,
  utm_source: 100, utm_medium: 100, utm_campaign: 150, utm_content: 150, utm_term: 150
};

function correoInterno(reg) {
  const filas = [
    ['Fecha/hora', reg.fecha_hora], ['Organización', reg.organizacion], ['Contacto', reg.contacto],
    ['Cargo', reg.cargo || '—'], ['Frente de interés', reg.frente_interes || '—'], ['Email', reg.email], ['Teléfono', reg.telefono || '—'],
    ['Consentimiento respuesta', reg.consentimiento_respuesta ? 'Sí' : 'No'],
    ['Consentimiento comercial', reg.consentimiento_marketing ? 'Sí' : 'No'],
    ['Versión textos', reg.version_texto_consentimiento], ['Canal', reg.canal],
    ['Página origen', reg.pagina_origen], ['Página entrada', reg.pagina_entrada], ['Referrer', reg.referrer || '—'],
    ['UTM', [reg.utm_source, reg.utm_medium, reg.utm_campaign, reg.utm_content, reg.utm_term].filter(Boolean).join(' / ') || '—'],
    ['ID registro', reg.RowKey]
  ];
  const html = tablaHtml('Nueva solicitud de diagnóstico — www.regulatec.cl', filas);
  const mensaje = {
    subject: 'Nueva solicitud de diagnóstico — ' + reg.organizacion,
    body: { contentType: 'HTML', content: html },
    toRecipients: [{ emailAddress: { address: process.env.MAIL_TO || 'ventas@regulatec.cl' } }],
    replyTo: [{ emailAddress: { address: reg.email, name: reg.contacto } }]
  };
  if (process.env.MAIL_BCC) {
    mensaje.bccRecipients = process.env.MAIL_BCC.split(',').map(a => ({ emailAddress: { address: a.trim() } }));
  }
  return mensaje;
}

// BORRADOR — texto pendiente de aprobación de copy. Solo se envía si AUTORESPUESTA_ACTIVA=true.
function autorespuesta(reg) {
  return {
    subject: 'Recibimos su solicitud — RegulaTec by W-IT',
    body: {
      contentType: 'Text',
      content: `Hola ${reg.contacto}:\n\nRecibimos su solicitud de diagnóstico para ${reg.organizacion}. ` +
        'Un especialista de RegulaTec se comunicará con usted dentro de 24–48 horas hábiles.\n\nRegulaTec by W-IT'
    },
    toRecipients: [{ emailAddress: { address: reg.email, name: reg.contacto } }]
  };
}

module.exports = async function (context, req) {
  const responder = (status, body) => { context.res = { status, headers: { 'Content-Type': 'application/json' }, body }; };

  const d = req.body && typeof req.body === 'object' ? req.body : {};

  // Spam: honeypot con datos o envío demasiado rápido -> respuesta exitosa silenciosa, sin procesar.
  if (d.website || Number(d.ms_en_formulario) < TIEMPO_MINIMO_MS) return responder(200, { ok: true });

  if (excedeLimite('lead:' + ipDe(req), LIMITE_POR_IP)) return responder(429, { ok: false, error: 'demasiadas_solicitudes' });

  const reg = {};
  for (const [campo, max] of Object.entries(CAMPOS_TEXTO)) reg[campo] = limpiar(d[campo], max);
  reg.email = reg.email.toLowerCase();
  reg.consentimiento_respuesta = d.consentimiento_respuesta === true;
  reg.consentimiento_marketing = d.consentimiento_marketing === true;

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(reg.email);
  if (!reg.contacto || !reg.organizacion || !emailValido || !reg.consentimiento_respuesta) {
    return responder(400, { ok: false, error: 'datos_invalidos' });
  }

  const ahora = new Date();
  reg.PartitionKey = ahora.toISOString().slice(0, 7); // AAAA-MM
  reg.RowKey = ahora.toISOString().replace(/[-:.TZ]/g, '') + '-' + crypto.randomBytes(4).toString('hex');
  reg.fecha_hora = ahora.toISOString();
  // Estructura preparada para el proceso comercial (se completan después).
  reg.resultado_calificacion = '';
  reg.estado = 'nuevo';
  reg.siguiente_accion = '';
  reg.conversion = '';

  let guardado = false, notificado = false;
  try { guardado = !!(await guardarEnTabla(reg)).ok; }
  catch (e) { context.log.error('Error guardando lead', reg.RowKey, e.message); }

  try {
    const token = await tokenGraph();
    await enviarCorreo(token, correoInterno(reg));
    notificado = true;
    if (process.env.AUTORESPUESTA_ACTIVA === 'true') {
      try { await enviarCorreo(token, autorespuesta(reg)); }
      catch (e) { context.log.warn('Autorespuesta no enviada', reg.RowKey, e.message); }
    }
  } catch (e) { context.log.error('Error notificando lead', reg.RowKey, e.message); }

  if (!guardado && !notificado) return responder(502, { ok: false, error: 'no_procesado' });
  return responder(200, { ok: true, id: reg.RowKey });
};
