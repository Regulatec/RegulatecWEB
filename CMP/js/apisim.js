/* ============================================================
   Simulador de la API de Dataverse — CMP
   W-IT para Caja La Araucana

   Compone URLs OData reales contra el ambiente de demostración.
   - Las operaciones de CONECTIVIDAD y ESQUEMA funcionan siempre
     (no dependen del modelo de datos del CMP).
   - Las operaciones de NEGOCIO usan los nombres de tabla/prefijo
     configurables en la cabecera del simulador.
   - Filtro vacío = "todos": no se filtra y la columna se agrega
     al $select para poder identificar cada registro.
   ============================================================ */

var DV = {
  host: "https://demopgc.crm2.dynamics.com",
  version: "v9.2",
  prefix: "wit_",
  tablaConsent: "wit_consentimientos",
  tablaTextos: "wit_plantillaconsentimientos"
};

/* Códigos reales de finalidad (clave de negocio wit_finalidadbk) */
var FINALIDADES_BK = [
  ["COMCOM", "COMCOM — Comunicaciones comerciales"],
  ["CESION", "CESION — Cesión de datos a empresas asociadas"],
  ["REDEC", "REDEC — Registro de Deuda Consolidada"],
  ["PERFIL", "PERFIL — Perfilamiento"],
  ["PUBDIG", "PUBDIG — Publicidad digital"],
  ["INFOBL-CTR", "INFOBL-CTR"],
  ["INFOBL-LEG", "INFOBL-LEG"],
  ["INFOBL-INT", "INFOBL-INT"]
];

var CANALES = [
  ["", "— Todos los canales —"],
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
  ["", "— Todas las finalidades —"],
  ["comunicaciones-comerciales", "Comunicaciones comerciales"],
  ["evaluacion-crediticia", "Evaluación crediticia"],
  ["datos-sensibles-salud", "Datos sensibles — salud (art. 16)"],
  ["redec", "REDEC (NCG N°540)"],
  ["perfilamiento", "Perfilamiento y analítica"]
];

/* Construye la query OData sin cláusulas vacías ni "and" colgantes */
function odata(entity, cols, filters, orderby, top) {
  var parts = [];
  if (cols && cols.length) parts.push("$select=" + cols.join(","));
  if (filters && filters.length) parts.push("$filter=" + filters.join(" and "));
  if (orderby) parts.push("$orderby=" + orderby);
  if (top) parts.push("$top=" + top);
  return "/" + entity + (parts.length ? "?" + parts.join("&") : "");
}

var API_OPS = [
  {
    id: "whoami",
    nombre: "① Probar conexión (WhoAmI)",
    grupo: "Conectividad",
    objetivo: "Verifica en vivo que el ambiente responde y que la sesión está autenticada. Devuelve el identificador del usuario y de la organización. No depende del modelo de datos del CMP: funciona siempre.",
    vars: [],
    path: function () { return "/WhoAmI"; },
    resp: function () {
      return {
        "@odata.context": "$metadata#Microsoft.Dynamics.CRM.WhoAmIResponse",
        BusinessUnitId: "8f21c4a2-…-b7d1",
        UserId: "c4e91f07-…-2a55",
        OrganizationId: "1d7b39ac-…-9e04"
      };
    }
  },
  {
    id: "servicedoc",
    nombre: "② Listar TODAS las tablas (service document)",
    grupo: "Esquema",
    objetivo: "Devuelve el documento de servicio OData con el nombre exacto de todos los entity sets del ambiente. Es la consulta más simple y confiable para encontrar el nombre real de una tabla: ábrela y busca «plantilla» o «consentimiento» con Ctrl+F. No lleva filtros, por lo que no puede fallar por sintaxis.",
    vars: [],
    path: function () { return ""; },
    resp: function () {
      return {
        "@odata.context": "$metadata",
        value: [
          { name: "accounts", kind: "EntitySet", url: "accounts" },
          { name: "…", kind: "…", url: "…" },
          { name: "<prefijo>_plantilladeconsentimientos", kind: "EntitySet", url: "<prefijo>_plantilladeconsentimientos" },
          { name: "<prefijo>_consentimientos", kind: "EntitySet", url: "<prefijo>_consentimientos" }
        ],
        "//nota": "Copia el valor exacto de 'name' y pégalo en los campos de tabla de la cabecera del simulador."
      };
    }
  },
  {
    id: "tablas",
    nombre: "③ Descubrir tablas personalizadas",
    grupo: "Esquema",
    objetivo: "Lista las tablas personalizadas publicadas en el ambiente con su nombre lógico real. Sirve para identificar los nombres exactos del modelo de consentimientos y configurarlos en la cabecera del simulador. Funciona sin conocer el esquema.",
    vars: [{ k: "busca", label: "Filtrar por texto en el nombre (opcional)", type: "text", def: "" }],
    path: function (v) {
      var f = ["IsCustomEntity eq true"];
      if (v.busca) f.push("contains(LogicalName,'" + v.busca + "')");
      return odata("EntityDefinitions", ["LogicalName", "SchemaName", "EntitySetName"], f, "LogicalName");
    },
    resp: function () {
      return {
        "@odata.context": "$metadata#EntityDefinitions",
        value: [
          { LogicalName: "wit_consentimiento", SchemaName: "wit_Consentimiento", EntitySetName: "wit_consentimientos" },
          { LogicalName: "wit_finalidad", SchemaName: "wit_Finalidad", EntitySetName: "wit_finalidades" },
          { LogicalName: "wit_textolegal", SchemaName: "wit_TextoLegal", EntitySetName: "wit_textolegals" }
        ],
        "//nota": "Los nombres reales los devuelve el ambiente. Usa EntitySetName en la URL de las consultas."
      };
    }
  },
  {
    id: "columnas",
    nombre: "④ Descubrir columnas de una tabla",
    grupo: "Esquema",
    objetivo: "Lista las columnas de una tabla con su nombre lógico y tipo de dato. Permite confirmar los nombres exactos de los campos antes de construir las consultas de negocio.",
    vars: [{ k: "tabla", label: "Nombre lógico de la tabla", type: "text", def: "wit_consentimiento" }],
    path: function (v) {
      return "/EntityDefinitions(LogicalName='" + v.tabla + "')/Attributes?$select=LogicalName,AttributeType&$filter=IsCustomAttribute eq true";
    },
    resp: function () {
      return {
        "@odata.context": "$metadata#Attributes",
        value: [
          { LogicalName: "wit_rut", AttributeType: "String" },
          { LogicalName: "wit_finalidad", AttributeType: "Picklist" },
          { LogicalName: "wit_canal", AttributeType: "Picklist" },
          { LogicalName: "wit_estado", AttributeType: "Picklist" },
          { LogicalName: "wit_fechaevento", AttributeType: "DateTime" },
          { LogicalName: "wit_versiontexto", AttributeType: "String" }
        ]
      };
    }
  },
  {
    id: "texto",
    nombre: "Plantilla de consentimiento vigente",
    grupo: "Negocio",
    objetivo: "Obtener la plantilla publicada y vigente que el canal debe exhibir al titular. Regla del modelo: el canal se resuelve por la clave de negocio wit_canalbk y el centinela de «todos los canales» es la cadena 'TODOS' (no null). Una plantilla específica del canal SIEMPRE gana sobre la genérica, por lo que la resolución correcta son dos consultas encadenadas.",
    flujo: "F1 / F6",
    tabla: "tablaTextos",
    vars: [
      { k: "finalidad", label: "Finalidad (wit_finalidadbk)", type: "select", options: FINALIDADES_BK, def: "COMCOM" },
      { k: "canal", label: "Canal (wit_canalbk) — ej. SUCVIRT, WSPIN", type: "text", def: "SUCVIRT" },
      {
        k: "estrategia", label: "Estrategia de resolución", type: "select", def: "paso1",
        options: [
          ["paso1", "Paso 1 · plantilla específica del canal"],
          ["paso2", "Paso 2 · fallback a TODOS (si el paso 1 da 0 filas)"],
          ["combinada", "Una sola llamada · canal o TODOS"],
          ["atajo", "Atajo · vigente por finalidad, resolver en cliente"]
        ]
      }
    ],
    path: function (v, c) {
      var p = c.prefix;
      var cols = [p + "codigo", p + "nombre", p + "version", p + "textoclausula",
                  p + "finalidadbk", p + "canalbk", p + "estado",
                  p + "vigentedesde", p + "vigentehasta", p + "vigenciavalor", p + "vigenciaunidad"];
      var hoy = new Date().toISOString().slice(0, 10) + "T00:00:00Z";
      var vigencia = "(" + p + "vigentehasta eq null or " + p + "vigentehasta ge " + hoy + ")";
      var f = [p + "finalidadbk eq '" + v.finalidad + "'"];

      if (v.estrategia === "atajo") {
        f.push(p + "estado eq 2");
        f.push(p + "vigentehasta eq null");
        return odata(c.tablaTextos, cols, f, p + "version desc");
      }
      if (v.estrategia === "paso1") {
        f.push(p + "canalbk eq '" + v.canal + "'");
        f.push(p + "estado eq 2"); f.push(vigencia);
        return odata(c.tablaTextos, cols, f, p + "version desc", 1);
      }
      if (v.estrategia === "paso2") {
        f.push(p + "canalbk eq 'TODOS'");
        f.push(p + "estado eq 2"); f.push(vigencia);
        return odata(c.tablaTextos, cols, f, p + "version desc", 1);
      }
      f.push("(" + p + "canalbk eq '" + v.canal + "' or " + p + "canalbk eq 'TODOS')");
      f.push(p + "estado eq 2"); f.push(vigencia);
      return odata(c.tablaTextos, cols, f, p + "version desc");
    },
    resp: function (v, c) {
      var p = c.prefix;
      function row(codigo, nombre, version, canalbk, texto) {
        var r = {};
        r[p + "codigo"] = codigo;
        r[p + "nombre"] = nombre;
        r[p + "version"] = version;
        r[p + "finalidadbk"] = v.finalidad;
        r[p + "canalbk"] = canalbk;
        r[p + "estado"] = 2;
        r[p + "estado@OData.Community.Display.V1.FormattedValue"] = "Publicada";
        r[p + "vigentedesde"] = "2025-09-01T13:00:00Z";
        r[p + "vigentehasta"] = null;
        r[p + "vigenciavalor"] = v.finalidad === "REDEC" ? 15 : 24;
        r[p + "vigenciaunidad@OData.Community.Display.V1.FormattedValue"] = v.finalidad === "REDEC" ? "Días hábiles bancarios" : "Meses";
        r[p + "textoclausula"] = texto;
        return r;
      }
      var generica = row("PLT-01002", "Comunicaciones comerciales v3", 3, "TODOS",
        "Autorizo a Caja de Compensación La Araucana al tratamiento de mis datos personales con la finalidad indicada, conforme a la Ley N°21.719. Puedo revocar este consentimiento en cualquier momento.");
      var especifica = row("PLT-01014", "Cláusula WhatsApp v1", 1, v.canal,
        "Autorizo el tratamiento de mis datos personales para ser contactado por WhatsApp con la finalidad indicada, conforme a la Ley N°21.719.");
      var esWsp = (v.canal || "").toUpperCase() === "WSPIN";

      if (v.estrategia === "paso1") {
        return {
          "@odata.context": "$metadata#" + c.tablaTextos,
          "//paso": "Paso 1 — específica del canal '" + v.canal + "'. Si devuelve 0 filas, ejecutar el Paso 2.",
          value: esWsp ? [especifica] : []
        };
      }
      if (v.estrategia === "paso2") {
        return {
          "@odata.context": "$metadata#" + c.tablaTextos,
          "//paso": "Paso 2 — fallback a la plantilla genérica (canal 'TODOS').",
          value: [generica]
        };
      }
      if (v.estrategia === "atajo") {
        return {
          "@odata.context": "$metadata#" + c.tablaTextos,
          "//resolucion": "Elegir en el cliente la fila cuyo " + p + "canalbk coincida con el canal; si ninguna coincide, usar la de 'TODOS'.",
          value: esWsp ? [especifica, generica] : [generica]
        };
      }
      return {
        "@odata.context": "$metadata#" + c.tablaTextos,
        "//advertencia": "Con una sola llamada, $orderby=version desc NO garantiza que la específica gane sobre 'TODOS'. Preferir la resolución en dos pasos.",
        value: esWsp ? [especifica, generica] : [generica]
      };
    }
  },
  {
    id: "estado",
    nombre: "Estado de consentimiento por RUT",
    grupo: "Negocio",
    objetivo: "Consultar el estado vigente del titular antes de tratar sus datos. Con finalidad en «Todas» devuelve una fila por finalidad, incluyendo la columna de finalidad para identificarlas.",
    flujo: "F2",
    tabla: "tablaConsent",
    vars: [
      { k: "rut", label: "RUT del titular", type: "text", def: "12345678-5" },
      { k: "finalidad", label: "Finalidad", type: "select", options: FINALIDADES, def: "" },
      { k: "canal", label: "Canal de origen", type: "select", options: CANALES, def: "" }
    ],
    path: function (v, c) {
      var p = c.prefix, cols = [p + "estado", p + "fechaevento", p + "versiontexto"], f = [];
      if (v.rut) f.push(p + "rut eq '" + v.rut + "'");
      if (v.finalidad) f.push(p + "finalidad eq '" + v.finalidad + "'"); else cols.push(p + "finalidad");
      if (v.canal) f.push(p + "canal eq '" + v.canal + "'"); else cols.push(p + "canal");
      return odata(c.tablaConsent, cols, f, p + "fechaevento desc");
    },
    resp: function (v, c) {
      var p = c.prefix;
      function row(fin, canal, estado) {
        var r = {};
        r[p + "estado"] = estado;
        r[p + "fechaevento"] = "2026-10-14T11:32:07Z";
        r[p + "versiontexto"] = "v3.2";
        if (!v.finalidad) r[p + "finalidad"] = fin;
        if (!v.canal) r[p + "canal"] = canal;
        return r;
      }
      var rows = v.finalidad
        ? [row(v.finalidad, v.canal || "sucursal-virtual", "otorgado")]
        : [row("comunicaciones-comerciales", "sucursal-virtual", "otorgado"),
           row("evaluacion-crediticia", "web-publica", "otorgado"),
           row("redec", "sucursal-fisica", "vigente"),
           row("datos-sensibles-salud", "sucursal-virtual", "nunca_otorgado")];
      return { "@odata.context": "$metadata#" + c.tablaConsent, value: rows };
    }
  },
  {
    id: "redec",
    nombre: "REDEC · código interno y vigencia",
    grupo: "Negocio",
    objetivo: "Obtener el código interno de gestión, el código encriptado, la referencia a la evidencia digitalizada y el vencimiento de los 15 días hábiles bancarios, insumo de los reportes RDC30/RDC31.",
    flujo: "F4 / F5",
    tabla: "tablaConsent",
    vars: [{ k: "rut", label: "RUT del titular (vacío = todos)", type: "text", def: "12345678-5" }],
    path: function (v, c) {
      var p = c.prefix;
      var cols = [p + "codigointerno", p + "codigoencriptado", p + "vencimiento", p + "evidenciaref"];
      var f = [p + "finalidad eq 'redec'"];
      if (v.rut) f.push(p + "rut eq '" + v.rut + "'"); else cols.push(p + "rut");
      return odata(c.tablaConsent, cols, f, p + "vencimiento asc");
    },
    resp: function (v, c) {
      var p = c.prefix, r = {};
      if (!v.rut) r[p + "rut"] = "12345678-5";
      r[p + "codigointerno"] = "RDC-2026-004871";
      r[p + "codigoencriptado"] = "AES256:7d4f…c92e";
      r[p + "vencimiento"] = "2026-11-04";
      r[p + "evidenciaref"] = "evd/2026/10/RDC-2026-004871.pdf";
      return { "@odata.context": "$metadata#" + c.tablaConsent, value: [r] };
    }
  },
  {
    id: "auditoria",
    nombre: "Historial auditable de eventos",
    grupo: "Negocio",
    objetivo: "Recuperar el historial inmutable de un titular para responder derechos de acceso (ARCO+PB) o una fiscalización: cada otorgamiento, modificación y revocación con su método de verificación y metadatos.",
    flujo: "F5",
    tabla: "tablaConsent",
    vars: [
      { k: "rut", label: "RUT del titular (vacío = todos)", type: "text", def: "12345678-5" },
      { k: "top", label: "Máximo de eventos", type: "text", def: "10" }
    ],
    path: function (v, c) {
      var p = c.prefix;
      var cols = [p + "tipoevento", p + "finalidad", p + "canal", p + "fechaevento", p + "metodoverificacion"];
      var f = [];
      if (v.rut) f.push(p + "rut eq '" + v.rut + "'"); else cols.push(p + "rut");
      return odata(c.tablaConsent, cols, f, p + "fechaevento desc", v.top);
    },
    resp: function (v, c) {
      var p = c.prefix;
      function ev(tipo, fin, canal, fecha) {
        var r = {};
        if (!v.rut) r[p + "rut"] = "12345678-5";
        r[p + "tipoevento"] = tipo; r[p + "finalidad"] = fin; r[p + "canal"] = canal;
        r[p + "fechaevento"] = fecha; r[p + "metodoverificacion"] = "clave-unica";
        return r;
      }
      return {
        "@odata.context": "$metadata#" + c.tablaConsent,
        value: [
          ev("revocacion", "perfilamiento", "centro-contacto", "2026-10-18T09:14:55Z"),
          ev("otorgamiento", "redec", "sucursal-fisica", "2026-10-14T11:32:07Z"),
          ev("otorgamiento", "comunicaciones-comerciales", "sucursal-virtual", "2026-09-02T16:48:19Z")
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
  var urlEl = document.getElementById("simUrl");
  var respEl = document.getElementById("simResp");
  var flujoEl = document.getElementById("simFlujo");
  var copyBtn = document.getElementById("simCopy");
  var runBtn = document.getElementById("simRun");
  var ins = {
    host: document.getElementById("simHost"),
    prefix: document.getElementById("simPrefix"),
    tablaConsent: document.getElementById("simTblConsent"),
    tablaTextos: document.getElementById("simTblTextos")
  };

  var current = API_OPS[0];
  var values = {};

  Object.keys(ins).forEach(function (k) {
    if (ins[k]) { ins[k].value = DV[k]; ins[k].addEventListener("input", renderOut); }
  });

  function cfg() {
    return {
      host: (ins.host.value || DV.host).replace(/\/+$/, ""),
      prefix: ins.prefix.value || "",
      tablaConsent: ins.tablaConsent.value || DV.tablaConsent,
      tablaTextos: ins.tablaTextos.value || DV.tablaTextos
    };
  }

  function initValues(op) {
    values = {};
    op.vars.forEach(function (v) { values[v.k] = v.def; });
  }

  function renderTabs() {
    tabsEl.innerHTML = "";
    API_OPS.forEach(function (op) {
      var b = document.createElement("button");
      b.className = "sim-tab sim-tab--" + op.grupo.toLowerCase() + (op.id === current.id ? " is-active" : "");
      b.textContent = op.nombre;
      b.title = op.grupo;
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
    var c = cfg();
    return c.host + "/api/data/" + DV.version + current.path(values, c);
  }

  function renderOut() {
    var url = buildUrl();
    urlEl.textContent = url;
    urlEl.setAttribute("href", url);
    runBtn.setAttribute("href", url);
    respEl.textContent = JSON.stringify(current.resp(values, cfg()), null, 2);
  }

  function renderAll() {
    renderTabs();
    objEl.textContent = current.objetivo;
    flujoEl.textContent = current.flujo || current.grupo;
    renderVars();
    renderOut();
  }

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
