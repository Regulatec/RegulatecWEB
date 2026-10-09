/*
 * Medición de RegulaTec by W-IT — carga condicionada al consentimiento.
 *
 * Reglas (Nota de ejecución técnica §4.6):
 *  - Ninguna etiqueta no esencial se carga antes de que el visitante acepte cookies opcionales.
 *  - Los eventos se acumulan en window.dataLayer; solo salen del navegador cuando GTM/GA4
 *    se cargan tras el consentimiento.
 *  - Google Ads, LinkedIn Insight y Meta Pixel se configuran DENTRO del contenedor GTM,
 *    no en el código del sitio.
 *
 * PENDIENTE: completar GTM_ID con el contenedor real. Si queda vacío, no se carga.
 */
(function () {
  var CONFIG = {
    GTM_ID: '',              // PENDIENTE: ID real del contenedor (GTM-XXXXXXX). Vacío = no se carga.
    GA4_ID: 'G-W2YGKPKBS7'   // ID encontrado en contacto.html. Migrar a GTM cuando exista el contenedor.
  };
  var STORAGE_KEY = 'cookieConsent';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Consent Mode v2: todo denegado por defecto.
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', wait_for_update: 500
  });

  function leerConsentimiento() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { return null; }
  }

  var cargado = false;
  function cargarEtiquetas() {
    if (cargado) return;
    cargado = true;
    gtag('consent', 'update', {
      ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
    if (CONFIG.GTM_ID) {
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var g = document.createElement('script');
      g.async = true;
      g.src = 'https://www.googletagmanager.com/gtm.js?id=' + CONFIG.GTM_ID;
      document.head.appendChild(g);
    }
    if (CONFIG.GA4_ID) {
      var a = document.createElement('script');
      a.async = true;
      a.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA4_ID;
      document.head.appendChild(a);
      gtag('js', new Date());
      gtag('config', CONFIG.GA4_ID);
    }
  }

  // API usada por el banner de cookies: type = 'all' | 'essential' | 'config'
  window.rtConsent = {
    set: function (type) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: type, date: new Date().toISOString() }));
      } catch (e) {}
      if (type === 'all') cargarEtiquetas();
    },
    get: leerConsentimiento,
    aceptado: function () { var c = leerConsentimiento(); return !!(c && c.type === 'all'); }
  };

  // Eventos de negocio: form_start, form_submit_success, form_submit_error, diagnostico_start,
  // diagnostico_complete, checklist_delivered, whatsapp_click, meeting_booked.
  window.rtTrack = function (evento, params) {
    var datos = { event: evento };
    if (params) for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) datos[k] = params[k];
    window.dataLayer.push(datos);
    if (CONFIG.GA4_ID && cargado) gtag('event', evento, params || {});
  };
  window.trackWhatsApp = function (origen) { window.rtTrack('whatsapp_click', { origen: origen }); };

  // Atribución de primer toque en la sesión (UTM, referrer, página de entrada) para el formulario.
  try {
    if (!sessionStorage.getItem('rtAtribucion')) {
      var q = new URLSearchParams(location.search);
      sessionStorage.setItem('rtAtribucion', JSON.stringify({
        utm_source: q.get('utm_source') || '', utm_medium: q.get('utm_medium') || '',
        utm_campaign: q.get('utm_campaign') || '', utm_content: q.get('utm_content') || '',
        utm_term: q.get('utm_term') || '', referrer: document.referrer || '',
        pagina_entrada: location.pathname
      }));
    }
  } catch (e) {}
  window.rtAtribucion = function () {
    try { return JSON.parse(sessionStorage.getItem('rtAtribucion') || '{}'); } catch (e) { return {}; }
  };

  if (window.rtConsent.aceptado()) cargarEtiquetas();
})();
