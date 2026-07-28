/* ============================================================
   Datos de la arquitectura CMP — W-IT para Caja La Araucana
   Fuente: Especificación de Arquitectura CMP (RFP + Bases + R#)
   ============================================================ */

const COMPONENTS = {
  /* ---- Dominio A · Tenant Microsoft / Power Platform ---- */
  A1: { badge:"A1", name:"Environment CMP (DEV / QA / PROD)", tech:"Power Platform — environment dedicado y aislado",
        fn:"Contenedor de la solución con seguridad, ALM y capacidad independientes. No toca el Dynamics productivo.",
        resp:"W-IT implementa y administra · Caja provee licenciamiento y capacidad", refs:"R14" },
  A2: { badge:"A2", name:"Registro de consentimientos", tech:"Dataverse",
        fn:"Fuente única de verdad: eventos de otorgamiento / modificación / revocación por RUT único, finalidad, canal, versión de texto legal, método de verificación y metadatos (IP, sesión, ejecutivo). Historial inmutable y auditable.",
        resp:"W-IT", refs:"R20, R146" },
  A3: { badge:"A3", name:"Backoffice / Mantenedor", tech:"Model-driven app sobre Dataverse",
        fn:"Parametrización sin intervención técnica: finalidades por canal, textos legales versionados, vigencias, tipos de titular, canales y medios de autenticación. Log de auditoría. Perfiles: Admin. Consentimientos, Admin. Usuarios, Editor, Lector.",
        resp:"W-IT construye · Caja opera post-capacitación", refs:"R71, R147" },
  A4: { badge:"A4", name:"Motor de reglas", tech:"Dataverse + lógica de plataforma",
        fn:"Reglas por canal / finalidad / tipo de titular; vencimiento automático REDEC (15 días hábiles bancarios); regla Capa 2 (desmarcar todo = revocación de comunicaciones promocionales).",
        resp:"W-IT", refs:"R55, R21" },
  A5: { badge:"A5", name:"Dashboard de cumplimiento", tech:"Power BI",
        fn:"% de consentimientos vigentes vs. revocados para gerencia; reportes APDP en tiempo real e históricos; exportación PDF / Excel.",
        resp:"W-IT", refs:"R29" },
  A6: { badge:"A6", name:"Identidad corporativa", tech:"Microsoft Entra ID (híbrido con MFA)",
        fn:"SSO + MFA del backoffice; roles de seguridad; rotación de credenciales.",
        resp:"Caja (ya lo tiene) · W-IT configura la integración", refs:"R11, R52, R117, R148" },

  /* ---- Dominio B · Suscripción Azure de La Araucana ---- */
  B2: { badge:"B2", name:"Cola de ingreso de eventos", tech:"Azure Service Bus",
        fn:"Queue-based load leveling: toda escritura se encola y responde de inmediato con ID de transacción; absorbe peaks (peor escenario: 13M eventos); dead-letter queue monitoreada.",
        resp:"W-IT", refs:"R12" },
  B3: { badge:"B3", name:"Workers de procesamiento", tech:"Azure Functions",
        fn:"Consumen la cola y persisten en Dataverse (idempotente por ID único de evento); generan comprobante PDF para sucursal; disparan notificaciones; job de vencimiento REDEC; generación RDC30 / RDC31.",
        resp:"W-IT", refs:"R115, R108" },
  B4: { badge:"B4", name:"Read store de consulta (CQRS)", tech:"Azure Cosmos DB o Azure SQL (a definir)",
        fn:"Proyección del estado vigente por RUT / finalidad para la consulta en línea de los sistemas operacionales: baja latencia, sin depender de límites de API de Dataverse. Retorna estado por finalidad, canales Capa 2 y datos REDEC. Sirve además el texto legal vigente y versionado por finalidad/canal: el titular ve exactamente la versión que queda registrada en el evento.",
        resp:"W-IT", refs:"—" },
  B5: { badge:"B5", name:"Repositorio de evidencias", tech:"Azure Blob Storage · inmutabilidad WORM",
        fn:"Consentimiento digitalizado REDEC (PDF/MP3), conservación ≥5 años desde extinción/revocación (NCG 540). Nadie —ni un administrador— puede alterar o borrar. Dataverse guarda metadatos + código encriptado + referencia al archivo.",
        resp:"W-IT", refs:"R88, NCG 540" },
  B6: { badge:"B6", name:"Monitoreo y observabilidad", tech:"Azure Monitor + Application Insights",
        fn:"Disponibilidad, alertas y dashboards accesibles por la Caja; notificación de incidentes ≤30 min; ICR ≤24 h hábiles para críticos.",
        resp:"W-IT", refs:"Req. técnico 7" },
  B7: { badge:"B7", name:"Gestión de secretos", tech:"Azure Key Vault",
        fn:"Claves, certificados y cadenas de conexión; rotación programada.",
        resp:"W-IT", refs:"—" },

  /* ---- Dominio C · Ecosistema La Araucana (fuera de alcance W-IT) ---- */
  C1: { badge:"C1", name:"Consent ACL", tech:"Servicio intermediario (en diseño)",
        fn:"Único consumidor de la API CMP; traduce / orquesta hacia canales y sistemas internos; almacenamiento temporal para modo degradado con reintento.",
        resp:"Caja — desarrollo, operación y evolución", refs:"R9, R113, R116, R128" },
  C2: { badge:"C2", name:"Canales / Frontends", tech:"Sistemas propios de la Caja",
        fn:"Sucursal Virtual (incl. Centro de Preferencias), Web Pública, Simulador de Crédito, Portal Beneficios, Sucursal Física y Móvil, WhatsApp (bot Databot), Centro de Contacto (solo revocación), Afiliación Remota.",
        resp:"Caja", refs:"R22, R23, R89" },
  C3: { badge:"C3", name:"Sistemas operacionales", tech:"CRM · core de créditos · campañas",
        fn:"Consultan el estado de consentimiento vía ACL antes de tratar datos.",
        resp:"Caja", refs:"R143" },
  C4: { badge:"C4", name:"Conector CMF", tech:"Integración de la Caja",
        fn:"Consulta requerimientos REDEC pendientes; envío de consentimientos digitalizados y reportes RDC30 / RDC31 a la CMF con la información generada por el CMP.",
        resp:"Caja", refs:"R109, R126, R156" },
  C5: { badge:"C5", name:"Plataforma de correo", tech:"A definir en etapa de diseño",
        fn:"Envío del correo confirmatorio al titular. Mecanismo por definir.",
        resp:"Por definir en diseño", refs:"R15" },
  C6: { badge:"C6", name:"Apigee · API Gateway", tech:"Google Cloud Apigee (plataforma de La Araucana)",
        fn:"Gateway de APIs que La Araucana ya opera en GCP. Publica y gestiona la API del CMP (OpenAPI): OAuth 2.0, TLS 1.3, throttling, versionamiento y políticas de reintento. Reemplaza a Azure API Management, aprovechando la capacidad Apigee existente de la Caja: el CMP expone sus endpoints y Apigee es el punto de entrada. El Consent ACL consume la API a través de Apigee.",
        resp:"Caja (GCP / Apigee)", refs:"R38, R39" },

  /* ---- Dominio D · Externos ---- */
  TIT:{ badge:"D", name:"Titulares", tech:"Afiliados y no afiliados",
        fn:"~1.300.000 RUT. Interactúan únicamente con los canales de la Caja, nunca con el CMP.",
        resp:"—", refs:"R3" },
  CMF:{ badge:"D", name:"CMF · Regulador", tech:"Comisión para el Mercado Financiero",
        fn:"Recibe RDC30 / RDC31 y requerimientos de supervisión, siempre a través de los sistemas de la Caja.",
        resp:"Externo", refs:"—" },
  WIT:{ badge:"W-IT", name:"W-IT · Servicio administrado", tech:"Implementación + operación",
        fn:"Implementa y administra el servicio con accesos de soporte controlados (roles, JIT, auditoría). Soporte L–V 8:30–18:00 (Chile). Sin custodia de datos personales.",
        resp:"W-IT", refs:"R70" }
};

/* Aristas estructurales (fondo tenue del diagrama) */
const EDGES = [
  ["TIT","C2"], ["C2","C1"], ["C1","C6"], ["C6","B2"], ["B2","B3"],
  ["B3","A2"], ["B3","B5"], ["B3","B4"], ["C6","B4"], ["C3","C1"],
  ["A2","A5"], ["B3","C4"], ["C4","CMF"], ["A3","A2"], ["A6","A3"],
  ["C5","C1"], ["WIT","A2"], ["WIT","B3"], ["A4","A2"], ["B7","B3"], ["B6","B3"]
];

/* Flujos — cada paso: {node, text}; edges resaltadas por flujo */
const FLOWS = [
  {
    id:"F1", name:"F1 · Captura de consentimiento",
    desc:"Escritura asíncrona: el canal recibe respuesta inmediata con ID de transacción y el evento se procesa en segundo plano.",
    steps:[
      {node:"TIT", text:"El titular inicia una gestión en un canal de la Caja."},
      {node:"C2",  text:"El canal obtiene —vía ACL → API CMP— el texto legal vigente y versionado y lo expone junto al checkbox (sin pre-marcado); el titular otorga su consentimiento."},
      {node:"C1",  text:"El Consent ACL orquesta y llama a la API CMP con el evento y la versión del texto exhibido."},
      {node:"C6",  text:"Apigee (gateway de APIs de La Araucana) publica la API del CMP, valida OAuth2 / TLS 1.3 y enruta la escritura."},
      {node:"B2",  text:"El evento se encola en Service Bus → respuesta inmediata con ID de transacción."},
      {node:"B3",  text:"Un worker (Azure Functions) consume la cola, idempotente por ID único."},
      {node:"A2",  text:"Persiste el evento en Dataverse (fuente única de verdad)."},
      {node:"B4",  text:"Proyecta el estado vigente al read store (CQRS)."},
      {node:"B5",  text:"Si es REDEC: guarda PDF/MP3 en Blob WORM, genera código encriptado e inicia vigencia de 15 días hábiles."},
      {node:"C5",  text:"Dispara la notificación / correo confirmatorio al titular."}
    ]
  },
  {
    id:"F2", name:"F2 · Consulta de estado en línea",
    desc:"Lectura de baja latencia. Nunca toca Dataverse directamente: si Dataverse está en mantenimiento, la consulta sigue operando con el último estado proyectado.",
    steps:[
      {node:"C3", text:"Un sistema operacional necesita saber el estado antes de tratar datos."},
      {node:"C1", text:"El Consent ACL invoca la API CMP de consulta."},
      {node:"C6", text:"Apigee (gateway de La Araucana) enruta la consulta a la capa de lectura del CMP."},
      {node:"B4", text:"El read store responde estado por finalidad, canales Capa 2 y datos REDEC — baja latencia y resiliencia."}
    ]
  },
  {
    id:"F3", name:"F3 · Revocación",
    desc:"Igual a la captura, con efecto inmediato en la base y notificación a los sistemas dependientes. Centro de Contacto solo revoca (R89). Capa 2: desmarcar todos los canales = revocación promocional (R21).",
    steps:[
      {node:"C2", text:"El titular (o un ejecutivo) revoca desde un canal."},
      {node:"C1", text:"El Consent ACL llama a la API CMP."},
      {node:"C6", text:"Apigee (gateway de La Araucana) valida y enruta la solicitud de revocación."},
      {node:"B2", text:"El evento de revocación se encola."},
      {node:"B3", text:"El worker procesa la revocación de forma idempotente."},
      {node:"A2", text:"Efecto inmediato en Dataverse."},
      {node:"B4", text:"Se proyecta el nuevo estado y se notifica a los sistemas dependientes vía ACL."}
    ]
  },
  {
    id:"F4", name:"F4 · Vencimiento automático REDEC",
    desc:"Un job programado revoca automáticamente al cumplirse 15 días hábiles bancarios; el consentimiento queda disponible para nuevo otorgamiento.",
    steps:[
      {node:"B3", text:"Job programado detecta REDEC que cumplen 15 días hábiles bancarios."},
      {node:"A2", text:"Revoca automáticamente y audita el evento en Dataverse."},
      {node:"B4", text:"Proyecta el estado vencido al read store; queda disponible para nuevo otorgamiento."}
    ]
  },
  {
    id:"F5", name:"F5 · Reportería regulatoria",
    desc:"RDC30 (consentimientos obtenidos/revocados) y RDC31 (accesos bajo consentimiento) generados por el CMP; la Caja los envía a la CMF.",
    steps:[
      {node:"A2", text:"Los datos de consentimientos y accesos residen en Dataverse."},
      {node:"B3", text:"El worker genera RDC30 / RDC31 en formato MSI o campos en línea."},
      {node:"C4", text:"El Conector CMF de la Caja recibe la información generada."},
      {node:"CMF",text:"La Caja envía los reportes a la CMF."},
      {node:"A5", text:"En paralelo: reportes APDP y dashboard de cumplimiento desde Power BI."}
    ]
  },
  {
    id:"F6", name:"F6 · Administración (backoffice)",
    desc:"El usuario de la Caja parametriza la solución sin intervención técnica; la configuración vigente se publica hacia la capa API y el read store.",
    steps:[
      {node:"A6", text:"Usuario de la Caja ingresa con SSO Entra ID + MFA."},
      {node:"A3", text:"En el Mantenedor: crea/edita finalidades, versiona textos legales, habilita/deshabilita canales."},
      {node:"A2", text:"La parametrización se guarda en Dataverse."},
      {node:"B4", text:"Se publica hacia la capa API y el read store."},
      {node:"C1", text:"Los canales consumen la parametrización y el texto legal vigente y versionado vía ACL — el titular ve exactamente la versión que quedará registrada en su evento."}
    ]
  },
  {
    id:"F7", name:"F7 · Modo degradado",
    desc:"Resiliencia por diseño. Caída del CMP: los canales/ACL almacenan y reenvían (Caja, R116). Caída de Dataverse: la cola sigue aceptando escrituras y el read store sigue respondiendo lecturas.",
    steps:[
      {node:"C1", text:"Caída del CMP: el ACL almacena temporalmente los eventos y los reenvía al recuperarse."},
      {node:"B2", text:"Caída de Dataverse: la cola sigue aceptando escrituras sin pérdida."},
      {node:"B4", text:"El read store sigue respondiendo lecturas con el último estado proyectado."},
      {node:"B3", text:"Al recuperarse, el worker drena el backlog automáticamente — procesamiento idempotente, sin duplicados."},
      {node:"A2", text:"Dataverse queda consistente una vez drenada la cola."}
    ]
  }
];
