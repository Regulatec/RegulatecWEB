/* ============================================================
   Formulario de solicitud de demo → CRM
   Plataforma de Gestión de Consentimientos · W-IT + RegulaTec

   CONFIGURACIÓN (dos puntos a editar cuando esté desplegado el backend):
   1) CRM.endpoint: la URL del App Service, ej.
      "https://lead-a-dynamics.azurewebsites.net/api/lead"
      (ver backend/lead-a-dynamics/ en el repo). Mientras esté vacío, el
      formulario valida y cae a correo, de modo que nunca se pierde un lead.
   2) RECAPTCHA.siteKey: el "site key" de google.com/recaptcha/admin (v2).
      Mientras esté vacío, el formulario funciona igual, sin captcha.
   ============================================================ */

var CRM = {
  endpoint: "",                                 // ej: "https://lead-a-dynamics.azurewebsites.net/api/lead"
  fallbackEmail: "ventas@regulatec.cl",
  consentVersion: "v1.0",
  origen: "web-plataforma-consentimientos"
};

var RECAPTCHA = {
  siteKey: ""                                   // ej: "6Lc...ABC" (site key de reCAPTCHA v2)
};

(function () {
  "use strict";

  var form = document.getElementById("leadForm");
  if (!form) return;

  var okBox = document.getElementById("formOk");
  var okTxt = document.getElementById("formOkTxt");
  var btn = document.getElementById("leadSubmit");
  var resetBtn = document.getElementById("formReset");
  var captchaEl = document.getElementById("leadCaptcha");

  /* El widget solo se activa si hay site key configurado. Si no, se oculta
     y el formulario funciona igual (sin captcha). */
  if (captchaEl) {
    if (RECAPTCHA.siteKey) captchaEl.setAttribute("data-sitekey", RECAPTCHA.siteKey);
    else captchaEl.style.display = "none";
  }

  function captchaActive() {
    return !!(captchaEl && captchaEl.hasAttribute("data-sitekey"));
  }
  function captchaToken() {
    try { return (captchaActive() && window.grecaptcha) ? window.grecaptcha.getResponse() : ""; }
    catch (e) { return ""; }
  }
  function captchaReset() {
    try { if (captchaActive() && window.grecaptcha) window.grecaptcha.reset(); }
    catch (e) {}
  }

  var REQUIRED = {
    nombre: "Indique su nombre.",
    apellido: "Indique su apellido.",
    email: "Indique un correo válido.",
    empresa: "Indique su empresa u organización.",
    consentimiento: "Necesitamos su autorización para poder contactarlo."
  };

  function showErr(name, msg) {
    var el = form.querySelector('[data-err="' + name + '"]');
    if (el) el.textContent = msg || "";
    var input = form.querySelector('[name="' + name + '"]');
    if (input) input.classList.toggle("is-invalid", !!msg);
  }

  function clearErrs() {
    Object.keys(REQUIRED).forEach(function (k) { showErr(k, ""); });
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function validate(data) {
    var firstBad = null;
    clearErrs();
    showErr("captcha", "");
    Object.keys(REQUIRED).forEach(function (k) {
      var bad = false;
      if (k === "consentimiento") bad = !form.querySelector('[name="consentimiento"]').checked;
      else if (k === "email") bad = !validEmail(data.email || "");
      else bad = !(data[k] || "").trim();
      if (bad) { showErr(k, REQUIRED[k]); if (!firstBad) firstBad = k; }
    });
    if (captchaActive() && !captchaToken()) {
      showErr("captcha", "Confirme que no es un robot.");
      if (!firstBad) firstBad = "captcha";
    }
    if (firstBad) {
      var el = form.querySelector('[name="' + firstBad + '"]');
      if (el && el.focus) el.focus();
      return false;
    }
    return true;
  }

  function collect() {
    var fd = new FormData(form);
    var intereses = fd.getAll("interes");
    return {
      nombre: (fd.get("nombre") || "").trim(),
      apellido: (fd.get("apellido") || "").trim(),
      email: (fd.get("email") || "").trim(),
      telefono: (fd.get("telefono") || "").trim(),
      empresa: (fd.get("empresa") || "").trim(),
      cargo: (fd.get("cargo") || "").trim(),
      industria: fd.get("industria") || "",
      volumen_titulares: fd.get("volumen_titulares") || "",
      intereses: intereses,
      mensaje: (fd.get("mensaje") || "").trim(),
      /* Evidencia del consentimiento del propio formulario */
      consentimiento_contacto: !!form.querySelector('[name="consentimiento"]').checked,
      consentimiento_version: CRM.consentVersion,
      consentimiento_fecha: new Date().toISOString(),
      /* Trazabilidad de origen */
      origen: CRM.origen,
      url: location.href,
      referrer: document.referrer || "",
      captchaToken: captchaToken(),
      _hp: fd.get("_hp") || ""
    };
  }

  function mailtoFallback(d) {
    var cuerpo = [
      "SOLICITUD DE DEMO — Plataforma de Gestión de Consentimientos", "",
      "Nombre: " + d.nombre + " " + d.apellido,
      "Correo: " + d.email,
      "Teléfono: " + (d.telefono || "—"),
      "Empresa: " + d.empresa,
      "Cargo: " + (d.cargo || "—"),
      "Industria: " + (d.industria || "—"),
      "Volumen de titulares: " + (d.volumen_titulares || "—"),
      "Necesita resolver: " + (d.intereses.length ? d.intereses.join(", ") : "—"),
      "", "Mensaje:", (d.mensaje || "—"),
      "", "Autoriza el contacto: sí (" + d.consentimiento_version + " · " + d.consentimiento_fecha + ")",
      "Origen: " + d.origen
    ].join("\n");
    window.location.href = "mailto:" + CRM.fallbackEmail +
      "?subject=" + encodeURIComponent("Solicitud de demo — " + d.empresa) +
      "&body=" + encodeURIComponent(cuerpo);
  }

  function success(msg) {
    if (msg) okTxt.textContent = msg;
    form.hidden = true;
    okBox.hidden = false;
    okBox.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = collect();

    /* Trampa anti-spam: si viene relleno, se descarta en silencio */
    if (d._hp) { success(); return; }
    if (!validate(d)) return;
    delete d._hp;

    if (!CRM.endpoint) {
      mailtoFallback(d);
      success("Abrimos su cliente de correo con la solicitud. Si no se abrió, escríbanos a " + CRM.fallbackEmail + ".");
      return;
    }

    btn.disabled = true;
    var original = btn.textContent;
    btn.textContent = "Enviando…";

    fetch(CRM.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d)
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      success();
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = original;
      captchaReset();
      showErr("email", "No pudimos enviar la solicitud. Reintente o escríbanos a " + CRM.fallbackEmail + ".");
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      clearErrs();
      captchaReset();
      btn.disabled = false;
      btn.textContent = "Enviar solicitud";
      okBox.hidden = true;
      form.hidden = false;
      form.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  /* Limpia el error del campo al corregirlo */
  Object.keys(REQUIRED).forEach(function (k) {
    var el = form.querySelector('[name="' + k + '"]');
    if (el) el.addEventListener("input", function () { showErr(k, ""); });
    if (el && el.type === "checkbox") el.addEventListener("change", function () { showErr(k, ""); });
  });
})();
