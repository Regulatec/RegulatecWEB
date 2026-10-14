/*
 * Utilidades compartidas por las funciones de la API (lead, revocacion).
 * Configuración en Application settings del Static Web App (ver api/lead/index.js).
 */
const VENTANA_MS = 10 * 60 * 1000;
const intentos = new Map(); // por instancia; complementa (no reemplaza) una protección perimetral

function limpiar(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function escaparHtml(v) {
  return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function ipDe(req) {
  const xff = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff.replace(/:\d+$/, '') || 'desconocida';
}

function excedeLimite(clave, limite) {
  const ahora = Date.now();
  const lista = (intentos.get(clave) || []).filter(t => ahora - t < VENTANA_MS);
  lista.push(ahora);
  intentos.set(clave, lista);
  return lista.length > limite;
}

async function guardarEnTabla(registro) {
  const url = process.env.LEAD_TABLE_SAS_URL;
  if (!url) return { omitido: true };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json;odata=nometadata',
      Prefer: 'return-no-content',
      'x-ms-version': '2019-02-02'
    },
    body: JSON.stringify(registro)
  });
  if (!r.ok) throw new Error('Table Storage ' + r.status + ': ' + (await r.text()).slice(0, 300));
  return { ok: true };
}

async function tokenGraph() {
  const { GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET } = process.env;
  const r = await fetch(`https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GRAPH_CLIENT_ID, client_secret: GRAPH_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials'
    })
  });
  if (!r.ok) throw new Error('Token Graph ' + r.status);
  return (await r.json()).access_token;
}

async function enviarCorreo(token, mensaje) {
  const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.MAIL_SENDER)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: mensaje, saveToSentItems: true })
  });
  if (!r.ok) throw new Error('Graph sendMail ' + r.status + ': ' + (await r.text()).slice(0, 300));
}

function tablaHtml(titulo, filas) {
  return `<h2 style="font-family:Arial,sans-serif">${escaparHtml(titulo)}</h2>` +
    '<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
    filas.map(([k, v]) => `<tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold">${escaparHtml(k)}</td><td style="padding:6px 12px">${escaparHtml(v)}</td></tr>`).join('') +
    '</table>';
}

module.exports = { limpiar, escaparHtml, ipDe, excedeLimite, guardarEnTabla, tokenGraph, enviarCorreo, tablaHtml };
