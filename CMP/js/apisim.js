/* ============================================================
   Simulador de la API de Dataverse — CMP
   W-IT para Caja La Araucana
   Arma la URL OData real contra el ambiente de demostración y
   permite ejecutarla en el navegador (requiere sesión activa
   en el environment de Dynamics/Dataverse).
   ============================================================ */

var DV_DEFAULTS = {
  host: "https://demopgc.crm2.dynamics.com",
  version: "v9.2",
  prefix: "wit_"
};

var CANALES = [
  ["sucursal-virtual", "Sucursal Virtual"],
  ["web-publica", "Web Pública"],
  ["simulador-credito", "Simulador de Crédito"],
  ["portal-beneficios", "Portal Beneficios"],
  ["sucursal-fisica", "Sucursal Física"],
  ["sucursal-movil", "Sucursal Móvil"],
  ["whatsapp", "WhatsApp (Databot)"],
  ["centro-contacto", "Centro de Contacto"],
  ["afiliacion-remota", "Afiliación Remota"]
];

var FINALIDADES = [
  ["comunicaciones-comerciales", "Comunicaciones comerciales"],
  ["evaluacion-crediticia", "Evaluación crediticia"],
  ["datos-sensibles-salud", "Datos sensibles — salud (art. 16)"],
  ["redec", "REDEC (NCG N°540)"],
  ["perfilamiento", "Perfilamiento y analítica"]
];

/* p = prefijo de esquema (ej. wit_) · v = valores del formulario */
var API_OPS = [
  {
    id: "whoami",
    nombre: "Probar conexión (WhoAmI)",
    objetivo: "Verifica en vivo que el ambiente responde y que la sesión está autenticada. Devuelve el identificador del usuario y de la organización. No depende del esquema del CMP: sirve como prueba de conectividad real.",
    metodo: "GET",
    flujo: "Conectividad",
    vars: [],
    path: function () { return "/WhoAmI"; },
    resp: function () {
      return {
        "@odata.context": "$metadata#Microsoft.Dynamics.CRM.WhoAmIResponse",
        BusinessUnitId: "8f21c4a2-...-b7d1",
        UserId: "c4e91f07-...-2a55",
        OrganizationId: "1d7b39ac-...-9e04"
      };
    }
  },
  {
    id: "texto",
    nombre: "Texto legal vigente por canal y finalidad",
    objetivo: "Obtener el texto legal versionado que el canal debe exhibir al titular antes de capturar el consentimiento. El texto que se muestra es exactamente la versión que queda registrada en el evento.",
    metodo: "GET",
    flujo: "F1 / F6",
    vars: [
      { k: "canal", label: "Canal", type: "select", options: CANALES, def: "sucursal-virtual" },
      { k: "finalidad", label: "Finalidad", type: "select", options: FINALIDADES, def: "comunicaciones-comerciales" }
    ],
    path: function (v, p) {
      return "/" + p + "textoslegales?$select=" + p + "version," + p + "texto," + p + "vigenciadesde" +
        "&$filter=" + p + "canal eq '" + v.canal + "' and " + p + "finalidad eq '" + v.finalidad + "' and " + p + "vigente eq true";
    },
    resp: function (v, p) {
      var o = { "@odata.context": "$metadata#" + p + "textoslegales", value: [{}] };
      o.value[0][p + "version"] = "v3.2";
      o.value[0][p + "vigenciadesde"] = "2026-10-01";
      o.value[0][p + "canal"] = v.canal;
      o.value[0][p + "finalidad"] = v.finalidad;
      o.value[0][p + "texto"] = v.finalidad === "redec"
        ? "Autorizo a Caja de Compensación La Araucana a consultar mi información en el Registro de Deuda Consolidada (REDEC), conforme a la Ley N°21.680 y la NCG N°540 de la CMF, por 15 días hábiles bancarios."
        : "Autorizo a Caja de Compensación La Araucana al tratamiento de mis datos personales con la finalidad indicada, conforme a la Ley N°21.719. Puedo revocar este consentimiento en cualquier momento.";
      return o;
    }
  },
  {
    id: "estado",
    nombre: "Estado de consentimiento por RUT",
    objetivo: "Consultar el estado vigente del titular antes de tratar sus datos: finalidad, estado, canal de origen, versión del texto y fecha del último evento. En producción esta lectura se sirve desde el read store (CQRS).",
    metodo: "GET",
    flujo: "F2",
    vars: [
      { k: "rut", label: "RUT del titular", type: "text", def: "12345678-5" },
      { k: "finalidad", label: "Finalidad (opcional)", type: "select", options: [["", "Todas las finalidades"]].concat(FINALIDADES), def: "" }
    ],
    path: function (v, p) {
      return "/" + p + "consentimientos?$select=" + p + "finalidad," + p + "estado," + p + "fechaevento," + p + "canal," + p + "versiontexto" +
        "&$filter=" + p + "rut eq '" + v.rut + "'" + (v.finalidad ? " and " + p + "finalidad eq '" + v.finalidad + "'" : "") +
        "&$orderby=" + p + "fechaevento desc";
    },
    resp: function (v, p) {
      var fins = v.finalidad ? [v.finalidad] : ["comunicaciones-comerciales", "evaluacion-crediticia", "redec"];
      return {
        "@odata.context": "$metadata#" + p + "consentimientos",
        value: fins.map(function (f) {
          var r = {};
          r[p + "finalidad"] = f;
          r[p + "estado"] = f === "redec" ? "vigente" : "otorgado";
          r[p + "fechaevento"] = "2026-10-14T11:32:07Z";
          r[p + "canal"] = "sucursal-virtual";
          r[p + "versiontexto"] = "v3.2";
          return r;
        })
      };
    }
  },
  {
    id: "redec",
    nombre: "REDEC · código interno y vigencia",
    objetivo: "Obtener el código interno de gestión, el código encriptado, la referencia a la evidencia digitalizada y el vencimiento de los 15 días hábiles bancarios, insumo de los reportes RDC30/RDC31.",
    metodo: "GET",
    flujo: "F4 / F5",
    vars: [{ k: "rut", label: "RUT del titular", type: "text", def: "12345678-5" }],
    path: function (v, p) {
      return "/" + p + "consentimientos?$select=" + p + "codigointerno," + p + "codigoencriptado," + p + "vencimiento," + p + "evidenciaref" +
        "&$filter=" + p + "rut eq '" + v.rut + "' and " + p + "finalidad eq 'redec'";
    },
    resp: function (v, p) {
      var r = {};
      r[p + "codigointerno"] = "RDC-2026-004871";
      r[p + "codigoencriptado"] = "AES256:7d4f...c92e";
      r[p + "vencimiento"] = "2026-11-04";
      r[p + "evidenciaref"] = "evd/2026/10/RDC-2026-004871.pdf";
      return { "@odata.context": "$metadata#" + p + "consentimientos", value: [r] };
    }
  },
  {
    id: "auditoria",
    nombre: "Historial auditable de eventos",
    objetivo: "Recuperar el historial inmutable de un titular para responder derechos de acceso (ARCO+PB) o una fiscalización: cada otorgamiento, modificación y revocación con su evidencia y metadatos.",
    metodo: "GET",
    flujo: "F5",
    vars: [
      { k: "rut", label: "RUT del titular", type: "text", def: "12345678-5" },
      { k: "top", label: "Máximo de eventos", type: "text", def: "10" }
    ],
    path: function (v, p) {
      return "/" + p + "consentimientos?$select=" + p + "tipoevento," + p + "finalidad," + p + "canal," + p + "fechaevento," + p + "metodoverificacion," + p + "ip" +
        "&$filter=" + p + "rut eq '" + v.rut + "'&$orderby=" + p + "fechaevento desc&$top=" + v.top;
    },
    resp: function (v, p) {
      function ev(tipo, fin, fecha) {
        var r = {};
        r[p + "tipoevento"] = tipo; r[p + "finalidad"] = fin;
        r[p + "canal"] = tipo === "revocacion" ? "centro-contacto" : "sucursal-virtual";
        r[p + "fechaevento"] = fecha;
        r[p + "metodoverificacion"] = "clave-unica";
        r[p + "ip"] = "200.27.xxx.xxx";
        return r;
      }
      return {
        "@odata.context": "$metadata#" + p + "consentimientos",
        value: [
          ev("revocacion", "perfilamiento", "2026-10-18T09:14:55Z"),
          ev("otorgamiento", "redec", "2026-10-14T11:32:07Z"),
          ev("otorgamiento", "comunicaciones-comerciales", "2026-09-02T16:48:19Z")
        ]
      };
    }
  }
];

(function () {
  "use strict";
  var root = document.getElementById("apisim");
  if (!root) return;

  var tabsEl = document.getElementById("simTabs");
  var objEl = document.getElementById("simObjetivo");
  var varsEl = document.getElementById("simVars");
  var methodEl = document.getElementById("simMethod");
  var urlEl = document.getElementById("simUrl");
  var respEl = document.getElementById("simResp");
  var flujoEl = document.getElementById("simFlujo");
  var copyBtn = document.getElementById("simCopy");
  var runBtn = document.getElementById("simRun");
  var hostIn = document.getElementById("simHost");
  var prefixIn = document.getElementById("simPrefix");

  var current = API_OPS[0];
  var values = {};

  hostIn.value = DV_DEFAULTS.host;
  prefixIn.value = DV_DEFAULTS.prefix;

  function initValues(op) {
    values = {};
    op.vars.forEach(function (v) { values[v.k] = v.def; });
  }

  function renderTabs() {
    tabsEl.innerHTML = "";
    API_OPS.forEach(function (op) {
      var b = document.createElement("button");
      b.className = "sim-tab" + (op.id === current.id ? " is-active" : "");
      b.textContent = op.nombre;
      b.addEventListener("click", function () { current = op; initValues(op); renderAll(); });
      tabsEl.appendChild(b);
    });
  }

  function renderVars() {
    varsEl.innerHTML = "";
    if (!current.vars.length) {
      var p = document.createElement("p");
      p.className = "sim__novars";
      p.textContent = "Esta operación no requiere variables.";
      varsEl.appendChild(p);
      return;
    }
    current.vars.forEach(function (v) {
      var wrap = document.createElement("label");
      wrap.className = "sim-field";
      var lab = document.createElement("span");
      lab.className = "sim-field__lbl";
      lab.textContent = v.label;
      wrap.appendChild(lab);
      var input;
      if (v.type === "select") {
        input = document.createElement("select");
        v.options.forEach(function (o) {
          var opt = document.createElement("option");
          opt.value = o[0]; opt.textContent = o[1];
          if (o[0] === values[v.k]) opt.selected = true;
          input.appendChild(opt);
        });
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.value = values[v.k];
      }
      input.className = "sim-field__in";
      input.addEventListener("input", function () { values[v.k] = input.value; renderOut(); });
      input.addEventListener("change", function () { values[v.k] = input.value; renderOut(); });
      wrap.appendChild(input);
      varsEl.appendChild(wrap);
    });
  }

  function buildUrl() {
    var host = (hostIn.value || DV_DEFAULTS.host).replace(/\/+$/, "");
    var prefix = prefixIn.value || "";
    return host + "/api/data/" + DV_DEFAULTS.version + current.path(values, prefix);
  }

  function renderOut() {
    var url = buildUrl();
    methodEl.textContent = current.metodo;
    urlEl.textContent = url;
    urlEl.setAttribute("href", url);
    runBtn.setAttribute("href", url);
    respEl.textContent = JSON.stringify(current.resp(values, prefixIn.value || ""), null, 2);
  }

  function renderAll() {
    renderTabs();
    objEl.textContent = current.objetivo;
    flujoEl.textContent = current.flujo;
    renderVars();
    renderOut();
  }

  hostIn.addEventListener("input", renderOut);
  prefixIn.addEventListener("input", renderOut);

  copyBtn.addEventListener("click", function () {
    var txt = buildUrl();
    var done = function () {
      copyBtn.textContent = "✓ Copiada";
      setTimeout(function () { copyBtn.textContent = "Copiar URL"; }, 1400);
    };
    if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(done, done); } else { done(); }
  });

  initValues(current);
  renderAll();
})();
