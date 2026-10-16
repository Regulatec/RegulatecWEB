/*
 * POST /api/revocacion — Revocación de consentimiento (Nota de ejecución técnica §4.5).
 *
 * Registra la revocación en la misma tabla persistente que los leads (PartitionKey "revocacion-AAAA-MM"),
 * con fecha/hora, canal y alcance, y avisa a ventas@ para que la apliquen en sus listas y en el CRM.
 * Alcance: "marketing" (solo comunicaciones comerciales) o "todo" (incluye la base para responder la solicitud).
 */
const crypto = require('crypto');
const { limpiar, ipDe, excedeLimite, guardarEnTabla, tokenGraph, enviarCorreo, tablaHtml } = require('../shared/comun');

const LIMITE_POR_IP = 5;
const ALCANCES = { marketing: 'Comunicaciones comerciales', todo: 'Todo tratamiento basado en consentimiento' };

module.exports = async function (context, req) {
  const responder = (status, body) => { context.res = { status, headers: { 'Content-Type': 'application/json' }, body }; };
  const d = req.body && typeof req.body === 'object' ? req.body : {};

  if (d.website) return responder(200, { ok: true }); // honeypot
  if (excedeLimite('revocacion:' + ipDe(req), LIMITE_POR_IP)) return responder(429, { ok: false, error: 'demasiadas_solicitudes' });

  const email = limpiar(d.email, 160).toLowerCase();
  const alcance = ALCANCES[d.alcance] ? d.alcance : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !alcance) return responder(400, { ok: false, error: 'datos_invalidos' });

  const ahora = new Date();
  const reg = {
    PartitionKey: 'revocacion-' + ahora.toISOString().slice(0, 7),
    RowKey: ahora.toISOString().replace(/[-:.TZ]/g, '') + '-' + crypto.randomBytes(4).toString('hex'),
    tipo: 'revocacion_consentimiento',
    email, alcance,
    fecha_hora: ahora.toISOString(),
    canal: 'web:' + limpiar(d.pagina_origen, 200),
    estado: 'pendiente_aplicar'
  };

  let guardado = false, notificado = false;
  try { guardado = !!(await guardarEnTabla(reg)).ok; }
  catch (e) { context.log.error('Error guardando revocación', reg.RowKey, e.message); }

  try {
    const token = await tokenGraph();
    await enviarCorreo(token, {
      subject: 'Revocación de consentimiento — ' + email,
      body: {
        contentType: 'HTML',
        content: tablaHtml('Revocación de consentimiento — www.regulatec.cl', [
          ['Fecha/hora', reg.fecha_hora], ['Email', email], ['Alcance', ALCANCES[alcance]],
          ['Canal', reg.canal], ['ID registro', reg.RowKey]
        ]) + '<p style="font-family:Arial,sans-serif">Aplicar en listas de envío y CRM, y marcar el registro como aplicado.</p>'
      },
      toRecipients: [{ emailAddress: { address: process.env.MAIL_TO || 'ventas@regulatec.cl' } }]
    });
    notificado = true;
  } catch (e) { context.log.error('Error notificando revocación', reg.RowKey, e.message); }

  if (!guardado && !notificado) return responder(502, { ok: false, error: 'no_procesado' });
  return responder(200, { ok: true, id: reg.RowKey });
};
