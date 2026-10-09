/*
 * Datos de la demo de RegulaTec — 100% FICTICIOS.
 * La empresa, las personas, los RUT, los casos y las cifras son inventados para la demostración.
 * La estructura (familias de delitos, columnas de matriz, escalas P×I, etapas de denuncia, obligaciones)
 * sigue la metodología de trabajo de RegulaTec, sin datos de clientes.
 *
 * Todas las fechas son relativas al día en que se abre la demo, para que la información
 * (vencimientos, atrasos, alertas) se mantenga coherente en el tiempo.
 */
(function () {
  'use strict';
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  function d(n) { return new Date(hoy.getTime() + n * 86400000); }

  var personas = {
    vr: { nombre: 'Valentina Riquelme', cargo: 'Encargada de Prevención de Delitos', ini: 'VR', email: 'v.riquelme@cordillera-demo.cl' },
    cs: { nombre: 'Camilo Sandoval', cargo: 'Delegado de Protección de Datos', ini: 'CS', email: 'c.sandoval@cordillera-demo.cl' },
    mf: { nombre: 'Marcela Fuenzalida', cargo: 'Gerenta General', ini: 'MF', email: 'm.fuenzalida@cordillera-demo.cl' },
    dm: { nombre: 'Diego Montero', cargo: 'Gerente de Administración y Finanzas', ini: 'DM', email: 'd.montero@cordillera-demo.cl' },
    fh: { nombre: 'Francisca Henríquez', cargo: 'Gerenta de Personas', ini: 'FH', email: 'f.henriquez@cordillera-demo.cl' },
    tv: { nombre: 'Tomás Valdebenito', cargo: 'Jefe de Tecnología', ini: 'TV', email: 't.valdebenito@cordillera-demo.cl' },
    ip: { nombre: 'Ignacia Pizarro', cargo: 'Abogada interna', ini: 'IP', email: 'i.pizarro@cordillera-demo.cl' },
    rl: { nombre: 'Rodrigo Lillo', cargo: 'Jefe de Abastecimiento', ini: 'RL', email: 'r.lillo@cordillera-demo.cl' },
    pc: { nombre: 'Paula Cifuentes', cargo: 'Auditora interna', ini: 'PC', email: 'p.cifuentes@cordillera-demo.cl' },
    am: { nombre: 'Andrés Maturana', cargo: 'Gerente Comercial', ini: 'AM', email: 'a.maturana@cordillera-demo.cl' },
    jo: { nombre: 'Javiera Ortúzar', cargo: 'Jefa de Operaciones y Flota', ini: 'JO', email: 'j.ortuzar@cordillera-demo.cl' },
    rt: { nombre: 'Equipo RegulaTec', cargo: 'Soporte de cumplimiento', ini: 'RT', email: 'demo@regulatec.cl' }
  };

  // ---------- Escalas (P × I, 1–25) ----------
  var escala = {
    niveles: [
      { max: 4, nombre: 'Bajo', color: 'green' },
      { max: 9, nombre: 'Moderado', color: 'amber' },
      { max: 15, nombre: 'Alto', color: 'red' },
      { max: 25, nombre: 'Crítico', color: 'red' }
    ],
    umbralAlto: 10,
    revision: 'anual o ante cambios normativos o del negocio'
  };
  var efectividad = { 'Efectivo': { factor: 1 }, 'Parcialmente efectivo': { factor: 0.5 }, 'Inefectivo': { factor: 0 } };
  // Cadencia de PRUEBA de efectividad según la frecuencia de ejecución del control (no es la frecuencia del control).
  var frecuenciaDias = { 'Transaccional': 180, 'Permanente': 180, 'Diario': 90, 'Semanal': 90, 'Mensual': 90, 'Trimestral': 90, 'Semestral': 180, 'Anual': 365, 'Ocasional': 365 };

  function ev(n, ext, off, p) { return { n: n, ext: ext, f: d(off), p: p }; }

  // ---------- Controles (C-PR-NN) ----------
  function ctrl(id, titulo, detalle, oportunidad, naturaleza, frecuencia, resp, efect, ultimaOff, evidenciaEsperada, evidencias, pruebas, proximaOff) {
    var ultima = d(ultimaOff);
    return {
      id: id, titulo: titulo, detalle: detalle, oportunidad: oportunidad, naturaleza: naturaleza, frecuencia: frecuencia,
      resp: resp, efectividad: efect, ultimaPrueba: ultima,
      proximaPrueba: proximaOff != null ? d(proximaOff) : new Date(ultima.getTime() + frecuenciaDias[frecuencia] * 86400000),
      evidenciaEsperada: evidenciaEsperada, evidencias: evidencias, pruebas: pruebas
    };
  }
  function pr(off, p, r, o) { return { f: d(off), p: p, r: r, o: o }; }

  var controles = [
    ctrl('C-PR-01', 'Código de Ética con firma de recepción', 'Todo colaborador nuevo, director y gerente firma la recepción del Código de Ética al ingresar; se reitera la firma ante cada actualización.', 'Preventivo', 'Manual', 'Ocasional', 'fh', 'Efectivo', -120,
      'Actas de recepción firmadas y nómina de ingresos del período.', [ev('Recepcion_Codigo_Etica_ingresos_T2.pdf', 'pdf', -118, 'fh')],
      [pr(-120, 'pc', 'Efectivo', 'Muestra de 25 ingresos: 25/25 con firma.'), pr(-485, 'pc', 'Efectivo', 'Sin excepciones.')]),
    ctrl('C-PR-02', 'Cláusulas MPD en contratos de trabajo y proveedores', 'Los contratos de trabajo, el Reglamento Interno y los contratos con proveedores incluyen cláusulas de cumplimiento de la Ley 20.393 y obligación de denunciar.', 'Preventivo', 'Manual', 'Ocasional', 'ip', 'Parcialmente efectivo', -95,
      'Muestra de contratos vigentes con la cláusula incorporada.', [ev('Revision_clausulas_proveedores.xlsx', 'xlsx', -94, 'ip')],
      [pr(-95, 'pc', 'Parcialmente efectivo', '4 de 30 contratos de proveedores antiguos sin cláusula. Plan de regularización en curso.')]),
    ctrl('C-PR-03', 'Canal de denuncias e investigación', 'Canal web anónimo disponible para colaboradores y terceros; cada denuncia se registra, se evalúa su admisibilidad y se investiga según procedimiento.', 'Detectivo', 'Automático', 'Permanente', 'vr', 'Efectivo', -60,
      'Registro de denuncias, actas de admisibilidad e informes de cierre.', [ev('Reporte_canal_denuncias_semestre.pdf', 'pdf', -58, 'vr')],
      [pr(-60, 'pc', 'Efectivo', 'Plazos de acuse y admisibilidad cumplidos en 100% de los casos.')]),
    ctrl('C-PR-04', 'Capacitación anual en Modelo de Prevención', 'Programa anual obligatorio para todos los colaboradores con evaluación final; sesiones específicas para áreas expuestas (comercial, abastecimiento, finanzas).', 'Preventivo', 'Manual', 'Anual', 'vr', 'Parcialmente efectivo', -200,
      'Registro de asistencia, resultados de evaluación y material del curso.', [ev('Asistencia_capacitacion_MPD.xlsx', 'xlsx', -198, 'vr')],
      [pr(-200, 'pc', 'Parcialmente efectivo', 'Cobertura de 81%; meta 95%. Pendiente personal de turnos de bodega.')]),
    ctrl('C-PR-05', 'Matriz de poderes y doble firma', 'Pagos, contratos y compromisos sobre los montos definidos requieren doble firma conforme a la matriz de poderes vigente.', 'Preventivo', 'Automático', 'Transaccional', 'dm', 'Efectivo', -40,
      'Log del ERP con aprobaciones y matriz de poderes vigente.', [ev('Log_aprobaciones_ERP_muestra.xlsx', 'xlsx', -39, 'dm')],
      [pr(-40, 'pc', 'Efectivo', 'Muestra de 40 pagos: todos con doble aprobación.'), pr(-130, 'pc', 'Efectivo', 'Sin excepciones.')]),
    ctrl('C-PR-06', 'Política de regalos, invitaciones y hospitalidades', 'Prohíbe ofrecer o recibir beneficios a funcionarios públicos; regalos de privados sobre el umbral se declaran y aprueban por el EPD.', 'Preventivo', 'Manual', 'Trimestral', 'vr', 'Efectivo', -70,
      'Registro trimestral de declaraciones de regalos.', [ev('Registro_regalos_trimestre.xlsx', 'xlsx', -68, 'vr')],
      [pr(-70, 'vr', 'Efectivo', '6 declaraciones, todas dentro de política.')]),
    ctrl('C-PR-07', 'Declaración anual de conflictos de interés', 'Gerentes, jefaturas y personal de compras declaran anualmente relaciones con proveedores, clientes y funcionarios públicos.', 'Preventivo', 'Manual', 'Anual', 'vr', 'Efectivo', -380,
      'Declaraciones firmadas y análisis de conflictos detectados.', [ev('Declaraciones_conflicto_interes.pdf', 'pdf', -378, 'vr')],
      [pr(-380, 'pc', 'Efectivo', '100% de declaraciones recibidas.')]),
    ctrl('C-PR-08', 'Debida diligencia de proveedores y socios', 'Antes de contratar, se verifica identidad, beneficiario final, antecedentes y listas restrictivas; los proveedores críticos se reevalúan cada año.', 'Preventivo', 'Manual', 'Transaccional', 'rl', 'Parcialmente efectivo', -150,
      'Fichas de debida diligencia y resultado de screening.', [ev('DD_proveedores_criticos.xlsx', 'xlsx', -148, 'rl')],
      [pr(-150, 'pc', 'Parcialmente efectivo', '3 proveedores críticos sin reevaluación anual.')]),
    ctrl('C-PR-09', 'Screening de listas restrictivas y PEP', 'Clientes, proveedores y contrapartes se contrastan contra listas de sanciones y personas expuestas políticamente al alta y en forma periódica.', 'Detectivo', 'Automático', 'Mensual', 'dm', 'Efectivo', -28,
      'Reporte mensual de coincidencias y su resolución.', [ev('Screening_mensual_resultados.pdf', 'pdf', -27, 'dm')],
      [pr(-28, 'vr', 'Efectivo', '2 falsos positivos documentados.')]),
    ctrl('C-PR-10', 'Conciliaciones bancarias y revisión de pagos inusuales', 'Conciliación mensual y revisión de pagos a cuentas nuevas, montos fuera de rango o beneficiarios sin contrato.', 'Detectivo', 'Manual', 'Mensual', 'dm', 'Efectivo', -45,
      'Conciliaciones firmadas y reporte de excepciones.', [ev('Conciliacion_bancaria.xlsx', 'xlsx', -44, 'dm')],
      [pr(-45, 'pc', 'Efectivo', 'Conciliaciones al día.')]),
    ctrl('C-PR-11', 'Protocolo de relación con funcionarios públicos', 'Reuniones con autoridades y fiscalizadores se agendan, se realizan con al menos dos representantes y se registran en bitácora.', 'Preventivo', 'Manual', 'Trimestral', 'ip', 'Inefectivo', -100,
      'Bitácora de reuniones con autoridades.', [],
      [pr(-100, 'pc', 'Inefectivo', 'Bitácora sin registros en 2 de 3 meses revisados; se detectaron reuniones con municipios no registradas.')]),
    ctrl('C-PR-12', 'Validación de documentación tributaria y facturas', 'Facturas de proveedores se validan contra orden de compra y recepción conforme; se verifica la situación tributaria del emisor.', 'Preventivo', 'Automático', 'Transaccional', 'dm', 'Efectivo', -50,
      'Reporte del ERP de facturas validadas y rechazadas.', [ev('Facturas_rechazadas_trimestre.xlsx', 'xlsx', -49, 'dm')],
      [pr(-50, 'pc', 'Efectivo', 'Sin excepciones.')]),
    ctrl('C-PR-13', 'Control de pago de cotizaciones previsionales', 'Conciliación mensual entre remuneraciones y cotizaciones declaradas y pagadas.', 'Detectivo', 'Manual', 'Mensual', 'fh', 'Efectivo', -35,
      'Certificados de pago y conciliación mensual.', [ev('Conciliacion_cotizaciones.pdf', 'pdf', -34, 'fh')],
      [pr(-35, 'pc', 'Efectivo', 'Pagos dentro de plazo.')]),
    ctrl('C-PR-14', 'Gestión de accesos y revisión de privilegios', 'Altas, bajas y cambios de acceso se aprueban formalmente; revisión trimestral de cuentas privilegiadas y MFA obligatorio.', 'Preventivo', 'Automático', 'Trimestral', 'tv', 'Parcialmente efectivo', -97,
      'Informe de revisión de accesos y cuentas dadas de baja.', [ev('Revision_accesos_privilegiados.xlsx', 'xlsx', -96, 'tv')],
      [pr(-97, 'pc', 'Parcialmente efectivo', '5 cuentas de ex colaboradores activas más de 10 días tras su salida.')]),
    ctrl('C-PR-15', 'Gestión de residuos y derrames de flota', 'Retiro de aceites, neumáticos y residuos peligrosos solo con gestores autorizados; protocolo de contención de derrames en patios.', 'Preventivo', 'Manual', 'Mensual', 'jo', 'Efectivo', -20,
      'Guías de retiro de residuos y registro de incidentes.', [ev('Guias_retiro_residuos.pdf', 'pdf', -19, 'jo')],
      [pr(-20, 'vr', 'Efectivo', 'Gestores con autorización vigente.')]),
    ctrl('C-PR-16', 'Monitoreo de transacciones con clientes', 'Alertas por pagos de terceros, pagos en efectivo sobre umbral o cambios repentinos de volumen de clientes.', 'Detectivo', 'Automático', 'Mensual', 'am', 'Efectivo', -25,
      'Reporte de alertas y su análisis.', [ev('Alertas_transaccionales_mes.xlsx', 'xlsx', -24, 'am')],
      [pr(-25, 'vr', 'Efectivo', '3 alertas analizadas y cerradas.')], 5)
  ];
  var controlesById = {}; controles.forEach(function (c) { controlesById[c.id] = c; });

  // ---------- Riesgos (matriz delito × proceso) ----------
  function hist(items) { return items.map(function (h) { return { t: h[0], f: d(h[1]), p: h[2] }; }); }
  var riesgos = [
    { id: 'R-001', familia: 'Administración pública', codigo: 'D1.1', delito: 'Cohecho a funcionario público', norma: 'Código Penal, arts. 250 y 250 bis', proceso: 'Obtención de permisos municipales y patentes', area: 'Operaciones', prob: 4, imp: 5,
      descripcion: 'Ofrecer o entregar un beneficio a un funcionario municipal para acelerar permisos de operación de bodegas o evitar una fiscalización.',
      senales: ['Pagos a gestores sin contrato formal', 'Permisos obtenidos en plazos inusualmente cortos', 'Reuniones con autoridades sin registro'],
      controles: ['C-PR-11', 'C-PR-06', 'C-PR-05', 'C-PR-03'], resp: 'jo', evidencias: [ev('Bitacora_reuniones_autoridades.xlsx', 'xlsx', -100, 'ip')],
      historial: hist([['Control C-PR-11 evaluado como inefectivo: riesgo residual sube a Alto', -100, 'vr'], ['Revisión anual de la matriz', -300, 'vr'], ['Riesgo identificado en entrevistas con Operaciones', -650, 'rt']]), proximaRevision: d(65) },
    { id: 'R-002', familia: 'Administración pública', codigo: 'D1.2', delito: 'Cohecho a funcionario público', norma: 'Código Penal, arts. 250 y 250 bis', proceso: 'Licitaciones y contratos con el Estado', area: 'Comercial', prob: 3, imp: 5,
      descripcion: 'Ofrecer beneficios a funcionarios de servicios públicos para favorecer la adjudicación de contratos de distribución.',
      senales: ['Contacto con evaluadores durante la licitación', 'Uso de asesores externos con honorarios de éxito'],
      controles: ['C-PR-06', 'C-PR-07', 'C-PR-11', 'C-PR-04'], resp: 'am', evidencias: [ev('Declaracion_equipo_licitaciones.pdf', 'pdf', -210, 'am')],
      historial: hist([['Revisión anual de la matriz', -300, 'vr'], ['Riesgo identificado en diagnóstico inicial', -650, 'rt']]), proximaRevision: d(65) },
    { id: 'R-003', familia: 'Lavado de activos, receptación y financiamiento del terrorismo', codigo: 'D2.1', delito: 'Lavado de activos', norma: 'Ley 19.913, art. 27', proceso: 'Captación y pago de clientes', area: 'Comercial', prob: 3, imp: 5,
      descripcion: 'Uso de la empresa por parte de clientes para dar apariencia de legitimidad a fondos de origen ilícito mediante pagos de terceros o en efectivo.',
      senales: ['Pagos de terceros sin relación con el cliente', 'Prepagos excesivos y solicitudes de devolución', 'Clientes sin actividad económica verificable'],
      controles: ['C-PR-09', 'C-PR-16', 'C-PR-10'], resp: 'am', evidencias: [ev('Politica_conozca_a_su_cliente.pdf', 'pdf', -400, 'vr')],
      historial: hist([['Revisión anual de la matriz', -300, 'vr'], ['Riesgo identificado en diagnóstico inicial', -650, 'rt']]), proximaRevision: d(65) },
    { id: 'R-004', familia: 'Lavado de activos, receptación y financiamiento del terrorismo', codigo: 'D2.2', delito: 'Receptación', norma: 'Código Penal, art. 456 bis A', proceso: 'Compra de repuestos y neumáticos', area: 'Abastecimiento', prob: 3, imp: 3,
      descripcion: 'Adquirir repuestos o neumáticos de procedencia ilícita a precios bajo mercado, sin documentación tributaria válida.',
      senales: ['Precios muy inferiores al mercado', 'Proveedores sin inicio de actividades', 'Compras sin factura'],
      controles: ['C-PR-08', 'C-PR-12'], resp: 'rl', evidencias: [],
      historial: hist([['Debida diligencia con observaciones: 3 proveedores sin reevaluación', -150, 'pc'], ['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-005', familia: 'Lavado de activos, receptación y financiamiento del terrorismo', codigo: 'D2.3', delito: 'Financiamiento del terrorismo', norma: 'Ley 18.314, art. 8', proceso: 'Donaciones y auspicios', area: 'Gerencia General', prob: 1, imp: 5,
      descripcion: 'Entregar recursos a organizaciones sin verificar su identidad, finalidad ni vinculación con listas restrictivas.',
      senales: ['Donaciones a entidades sin personalidad jurídica', 'Solicitudes de aporte en efectivo'],
      controles: ['C-PR-09', 'C-PR-05'], resp: 'mf', evidencias: [ev('Politica_donaciones.pdf', 'pdf', -420, 'ip')],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-006', familia: 'Patrimonio', codigo: 'D3.1', delito: 'Administración desleal', norma: 'Código Penal, art. 470 N°11', proceso: 'Pagos a proveedores', area: 'Finanzas', prob: 3, imp: 4,
      descripcion: 'Quien administra recursos de la empresa (o de clientes en custodia) los perjudica mediante pagos injustificados o condiciones abusivas.',
      senales: ['Pagos sin orden de compra', 'Proveedores con domicilio coincidente con colaboradores'],
      controles: ['C-PR-05', 'C-PR-10', 'C-PR-12'], resp: 'dm', evidencias: [ev('Matriz_poderes_vigente.pdf', 'pdf', -230, 'dm')],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-007', familia: 'Patrimonio', codigo: 'D3.2', delito: 'Apropiación indebida', norma: 'Código Penal, art. 470 N°1', proceso: 'Custodia de mercadería de clientes', area: 'Operaciones', prob: 3, imp: 4,
      descripcion: 'Apropiación de mercadería de clientes recibida en bodega para almacenaje o distribución.',
      senales: ['Diferencias de inventario recurrentes', 'Mermas no explicadas en rutas específicas'],
      controles: ['C-PR-03', 'C-PR-10'], resp: 'jo', evidencias: [ev('Inventario_ciclico_bodega_norte.xlsx', 'xlsx', -30, 'jo')],
      historial: hist([['Denuncia DEN-' + hoy.getFullYear() + '-009 vinculada a este riesgo', -12, 'vr'], ['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-008', familia: 'Orden público económico', codigo: 'D4.1', delito: 'Corrupción entre particulares', norma: 'Código Penal, arts. 287 bis y 287 ter', proceso: 'Selección y contratación de proveedores', area: 'Abastecimiento', prob: 4, imp: 3,
      descripcion: 'Un comprador acepta beneficios de un proveedor para favorecerlo en la adjudicación de servicios de transporte tercerizado.',
      senales: ['Mismo proveedor adjudicado sin cotizaciones', 'Regalos no declarados', 'Relación personal con el proveedor'],
      controles: ['C-PR-06', 'C-PR-07', 'C-PR-08'], resp: 'rl', evidencias: [ev('Comparativo_cotizaciones_transporte.xlsx', 'xlsx', -80, 'rl')],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-009', familia: 'Orden público económico', codigo: 'D4.2', delito: 'Negociación incompatible', norma: 'Código Penal, art. 240', proceso: 'Contratos con partes relacionadas', area: 'Gerencia General', prob: 2, imp: 4,
      descripcion: 'Un gerente o director se interesa en un contrato en que interviene la empresa, sin declararlo ni abstenerse.',
      senales: ['Contratos con empresas de familiares', 'Falta de declaración de intereses'],
      controles: ['C-PR-07', 'C-PR-05'], resp: 'mf', evidencias: [],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-010', familia: 'Tributarios y aduaneros', codigo: 'D5.1', delito: 'Uso de facturas falsas', norma: 'Código Tributario, art. 97 N°4', proceso: 'Registro contable y facturación', area: 'Finanzas', prob: 2, imp: 4,
      descripcion: 'Registro de facturas por servicios inexistentes para aumentar el crédito fiscal o justificar salidas de fondos.',
      senales: ['Servicios sin respaldo de recepción', 'Proveedores con alertas tributarias'],
      controles: ['C-PR-12', 'C-PR-05'], resp: 'dm', evidencias: [ev('Validacion_facturas_ERP.xlsx', 'xlsx', -50, 'dm')],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-011', familia: 'Informáticos', codigo: 'D6.1', delito: 'Acceso ilícito a sistemas', norma: 'Ley 21.459, art. 2', proceso: 'Administración de sistemas y accesos', area: 'Tecnología', prob: 3, imp: 4,
      descripcion: 'Colaboradores o ex colaboradores acceden sin autorización a sistemas de clientes o a bases de datos de despacho.',
      senales: ['Cuentas activas de ex colaboradores', 'Accesos fuera de horario', 'Credenciales compartidas'],
      controles: ['C-PR-14'], resp: 'tv', evidencias: [ev('Revision_accesos_privilegiados.xlsx', 'xlsx', -96, 'tv')],
      historial: hist([['Revisión de accesos con observaciones', -97, 'pc'], ['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-012', familia: 'Informáticos', codigo: 'D6.2', delito: 'Fraude informático', norma: 'Ley 21.459, art. 7', proceso: 'Pagos electrónicos y cambio de cuentas', area: 'Finanzas', prob: 3, imp: 4,
      descripcion: 'Manipulación de datos de pago (cambio de cuenta bancaria de un proveedor) para desviar transferencias.',
      senales: ['Solicitudes de cambio de cuenta por correo', 'Urgencia inusual en pagos'],
      controles: ['C-PR-05', 'C-PR-10', 'C-PR-14'], resp: 'dm', evidencias: [],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-013', familia: 'Seguridad social e integridad personal', codigo: 'D7.1', delito: 'Apropiación de cotizaciones previsionales', norma: 'Ley 17.322', proceso: 'Remuneraciones', area: 'Personas', prob: 1, imp: 4,
      descripcion: 'Descontar cotizaciones de las remuneraciones sin enterarlas en las instituciones previsionales.',
      senales: ['Atrasos en pagos previsionales', 'Reclamos de trabajadores por lagunas'],
      controles: ['C-PR-13'], resp: 'fh', evidencias: [ev('Conciliacion_cotizaciones.pdf', 'pdf', -34, 'fh')],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-014', familia: 'Medio ambiente', codigo: 'D8.1', delito: 'Contaminación por residuos peligrosos', norma: 'Código Penal, delitos ambientales (Ley 21.595)', proceso: 'Mantención de flota y patios', area: 'Operaciones', prob: 2, imp: 4,
      descripcion: 'Disposición de aceites usados o derrames de combustible sin gestor autorizado, afectando suelo o cursos de agua.',
      senales: ['Retiros de residuos sin guía', 'Derrames no reportados'],
      controles: ['C-PR-15'], resp: 'jo', evidencias: [ev('Guias_retiro_residuos.pdf', 'pdf', -19, 'jo')],
      historial: hist([['Riesgo incorporado por actualización Ley 21.595', -520, 'rt']]), proximaRevision: d(65) },
    { id: 'R-015', familia: 'Patrimonio', codigo: 'D3.3', delito: 'Estafa', norma: 'Código Penal, arts. 467 y 468', proceso: 'Facturación a clientes', area: 'Comercial', prob: 2, imp: 3,
      descripcion: 'Facturar a clientes servicios no prestados o con sobreprecio mediante engaño en guías de despacho.',
      senales: ['Reclamos de clientes por cobros', 'Notas de crédito recurrentes'],
      controles: ['C-PR-04', 'C-PR-03'], resp: 'am', evidencias: [],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) },
    { id: 'R-016', familia: 'Administración pública', codigo: 'D1.3', delito: 'Entrega de información falsa a la autoridad', norma: 'Código Penal (fe pública)', proceso: 'Respuesta a fiscalizaciones', area: 'Legal', prob: 2, imp: 3,
      descripcion: 'Entregar a un fiscalizador información alterada o incompleta para evitar una sanción.',
      senales: ['Respuestas sin revisión legal', 'Documentos modificados después de su emisión'],
      controles: ['C-PR-11', 'C-PR-01'], resp: 'ip', evidencias: [],
      historial: hist([['Revisión anual de la matriz', -300, 'vr']]), proximaRevision: d(65) }
  ];
  var familias = [];
  riesgos.forEach(function (r) { if (!familias.some(function (f) { return f.nombre === r.familia; })) familias.push({ nombre: r.familia }); });

  // ---------- Planes de mantención ----------
  function act(id, nombre, desc, resp, iniOff, finOff, periodicidad, evidencia, abierta) {
    var estado = finOff < 0 ? (abierta ? 'En curso' : 'Completada') : (iniOff <= 0 ? 'En curso' : 'Planificada');
    return { id: id, nombre: nombre, desc: desc, resp: resp, ini: d(iniOff), fin: d(finOff), periodicidad: periodicidad, evidencia: evidencia, estado: estado };
  }
  var planes = [
    { id: 'PM-MPD', nombre: 'Plan anual de mantención del MPD', norma: 'Ley 20.393', resp: 'vr',
      descripcion: 'Actividades recurrentes para mantener vigente el Modelo de Prevención de Delitos: revisión de matriz, pruebas de controles, capacitación y reportes al Directorio.',
      fases: [
        { nombre: 'Supervisión y reporte', actividades: [
          act('A-01', 'Informe semestral al Directorio (1er semestre)', 'Reporte del EPD sobre evolución de la matriz, controles, denuncias y brechas.', 'vr', -200, -185, 'Semestral', 'Acta de sesión de Directorio y presentación.'),
          act('A-02', 'Informe semestral al Directorio (2º semestre)', 'Reporte del EPD sobre el segundo semestre y propuesta de plan del año siguiente.', 'vr', 40, 60, 'Semestral', 'Acta de sesión de Directorio y presentación.'),
          act('A-03', 'Certificación del MPD por entidad externa', 'Evaluación independiente del diseño y funcionamiento del modelo.', 'vr', 70, 110, 'Bienal', 'Certificado e informe de la entidad evaluadora.')
        ] },
        { nombre: 'Riesgos y controles', actividades: [
          act('A-04', 'Revisión anual de la matriz de riesgos', 'Talleres con gerencias para actualizar procesos, riesgos y controles.', 'vr', -40, 30, 'Anual', 'Matriz actualizada y actas de talleres.'),
          act('A-05', 'Pruebas de efectividad de controles críticos', 'Auditoría interna prueba los controles asociados a riesgos altos.', 'pc', -150, -110, 'Semestral', 'Papeles de trabajo y resultado por control.'),
          act('A-06', 'Regularizar cláusulas en contratos de proveedores', 'Incorporar cláusulas MPD a los 4 contratos detectados sin cláusula.', 'ip', -90, -15, 'Única', 'Anexos de contrato firmados.', true),
          act('A-07', 'Reevaluación de proveedores críticos', 'Actualizar debida diligencia de proveedores críticos.', 'rl', -60, -5, 'Anual', 'Fichas de debida diligencia actualizadas.', true)
        ] },
        { nombre: 'Cultura y difusión', actividades: [
          act('A-08', 'Capacitación anual MPD — todo el personal', 'Curso e-learning con evaluación final.', 'vr', -240, -200, 'Anual', 'Registro de asistencia y notas.'),
          act('A-09', 'Capacitación focalizada a turnos de bodega', 'Sesiones presenciales para cerrar la brecha de cobertura.', 'fh', -10, 20, 'Única', 'Listas de asistencia firmadas.'),
          act('A-10', 'Declaración anual de conflictos de interés', 'Campaña de declaración para gerentes, jefaturas y compras.', 'vr', 15, 45, 'Anual', 'Declaraciones firmadas.')
        ] }
      ] },
    { id: 'PM-DP', nombre: 'Programa de adecuación Ley 21.719', norma: 'Ley 21.719', resp: 'cs',
      descripcion: 'Implementación y mantención del programa de protección de datos personales: registro de tratamientos, derechos, seguridad, contratos y capacitación.',
      fases: [
        { nombre: 'Diagnóstico', actividades: [
          act('B-01', 'Inventario de datos y entrevistas a áreas', 'Levantamiento de tratamientos con cada gerencia.', 'cs', -260, -220, 'Única', 'Minutas de entrevista e inventario.'),
          act('B-02', 'Análisis de brechas Ley 21.719', 'Comparación del estado actual con las obligaciones de la ley.', 'rt', -220, -190, 'Única', 'Informe de brechas.')
        ] },
        { nombre: 'Diseño e implementación', actividades: [
          act('B-03', 'Registro de actividades de tratamiento', 'Documentar finalidad, base de licitud, categorías y plazos de cada tratamiento.', 'cs', -180, -120, 'Permanente', 'RAT aprobado.'),
          act('B-04', 'Política de tratamiento y avisos de privacidad', 'Publicar política y actualizar avisos en web, app y formularios.', 'ip', -130, -80, 'Anual', 'Política publicada y capturas de avisos.'),
          act('B-05', 'Procedimiento de derechos ARCOP', 'Canal y flujo de respuesta con plazos y registro.', 'cs', -100, -60, 'Permanente', 'Procedimiento aprobado y registro de solicitudes.'),
          act('B-06', 'Anexos de tratamiento con encargados', 'Firmar cláusulas con proveedores que tratan datos por cuenta de la empresa.', 'ip', -70, -10, 'Única', 'Anexos firmados.', true),
          act('B-07', 'Evaluación de impacto: telemetría de conductores', 'EIPD del tratamiento de geolocalización y conducta de conductores.', 'cs', -20, 25, 'Única', 'Informe de evaluación de impacto.'),
          act('B-08', 'Protocolo de gestión de brechas de seguridad', 'Procedimiento de detección, evaluación y comunicación de vulneraciones.', 'tv', 5, 35, 'Anual', 'Protocolo aprobado y simulacro.')
        ] },
        { nombre: 'Cultura', actividades: [
          act('B-09', 'Capacitación en protección de datos', 'Curso para áreas que tratan datos de clientes y trabajadores.', 'cs', 20, 50, 'Anual', 'Registro de asistencia.')
        ] }
      ] }
  ];

  // ---------- Denuncias ----------
  var etapasDenuncia = ['Recibida', 'Admisibilidad', 'Investigación', 'Descargos', 'Informe final', 'Cerrada'];
  var categoriasDenuncia = ['Cohecho o soborno', 'Corrupción entre particulares', 'Fraude o apropiación indebida', 'Lavado de activos', 'Conflicto de interés', 'Mal uso de información', 'Acoso laboral o sexual', 'Discriminación', 'Infracción al Código de Ética', 'Delito ambiental', 'Otro'];
  var Y = hoy.getFullYear();
  function bit(items) { return items.map(function (b) { return { t: b[0], f: d(b[1]), p: b[2] }; }); }
  var denuncias = [
    { id: 'DEN-' + Y + '-011', fecha: d(-3), canal: 'Formulario web', categoria: 'Conflicto de interés', anonima: true, etapa: 0, plazo: d(2), prioridad: 'Media', investigador: 'vr', riesgo: 'R-008',
      resumen: 'Se informa que un comprador habría adjudicado servicios de transporte a una empresa de un familiar directo, sin cotizaciones.',
      bitacora: bit([['Denuncia recibida por formulario web. Folio y clave entregados al denunciante.', -3, 'rt']]) },
    { id: 'DEN-' + Y + '-010', fecha: d(-9), canal: 'Formulario web', categoria: 'Acoso laboral o sexual', anonima: false, etapa: 2, plazo: d(12), prioridad: 'Alta', investigador: 'fh', riesgo: null,
      resumen: 'Colaboradora denuncia conductas reiteradas de hostigamiento por parte de su jefatura directa.',
      bitacora: bit([['Medidas de resguardo: separación de espacios de trabajo', -6, 'fh'], ['Admisible. Se designa investigadora', -7, 'vr'], ['Acuse de recibo enviado', -8, 'vr'], ['Denuncia recibida', -9, 'rt']]) },
    { id: 'DEN-' + Y + '-009', fecha: d(-12), canal: 'Correo del EPD', categoria: 'Fraude o apropiación indebida', anonima: true, etapa: 2, plazo: d(-1), prioridad: 'Alta', investigador: 'pc', riesgo: 'R-007',
      resumen: 'Diferencias de inventario recurrentes en mercadería de un cliente en una bodega regional, coincidentes con un turno específico.',
      bitacora: bit([['Solicitud de registros de acceso y cámaras', -5, 'pc'], ['Admisible. Se asigna a Auditoría Interna', -10, 'vr'], ['Acuse de recibo', -11, 'vr'], ['Denuncia recibida', -12, 'rt']]) },
    { id: 'DEN-' + Y + '-008', fecha: d(-34), canal: 'Formulario web', categoria: 'Cohecho o soborno', anonima: true, etapa: 3, plazo: d(6), prioridad: 'Alta', investigador: 'ip', riesgo: 'R-001',
      resumen: 'Se reporta que un gestor externo habría ofrecido dinero a un inspector municipal para agilizar un permiso de bodega.',
      bitacora: bit([['Notificación al denunciado; plazo de descargos de 10 días hábiles', -4, 'ip'], ['Revisión de pagos al gestor externo', -18, 'dm'], ['Investigación iniciada', -30, 'ip'], ['Admisible. Riesgo R-001 vinculado', -31, 'vr'], ['Denuncia recibida', -34, 'rt']]) },
    { id: 'DEN-' + Y + '-007', fecha: d(-52), canal: 'Buzón físico', categoria: 'Infracción al Código de Ética', anonima: true, etapa: 4, plazo: d(3), prioridad: 'Baja', investigador: 'vr', riesgo: null,
      resumen: 'Uso de vehículos de la empresa para fines personales durante fines de semana.',
      bitacora: bit([['Borrador de informe final enviado al Comité', -2, 'vr'], ['Revisión de registros GPS', -30, 'jo'], ['Admisible', -48, 'vr'], ['Denuncia recibida', -52, 'rt']]) },
    { id: 'DEN-' + Y + '-006', fecha: d(-80), canal: 'Formulario web', categoria: 'Mal uso de información', anonima: false, etapa: 5, plazo: d(-50), prioridad: 'Media', investigador: 'cs', riesgo: null,
      resumen: 'Ejecutivo habría enviado una base de clientes a su correo personal antes de renunciar.',
      bitacora: bit([['Caso cerrado: hechos acreditados; acciones legales evaluadas', -52, 'vr'], ['Evaluación como incidente de datos personales', -75, 'cs'], ['Denuncia recibida', -80, 'rt']]) },
    { id: 'DEN-' + Y + '-005', fecha: d(-120), canal: 'Formulario web', categoria: 'Discriminación', anonima: true, etapa: 5, plazo: d(-95), prioridad: 'Media', investigador: 'fh', riesgo: null,
      resumen: 'Reclamo por criterios de asignación de turnos percibidos como discriminatorios.',
      bitacora: bit([['Caso cerrado: no se acreditan los hechos; se ajusta procedimiento de turnos', -95, 'fh'], ['Denuncia recibida', -120, 'rt']]) }
  ];

  // ---------- Protección de datos ----------
  var rat = [
    { id: 'TR-01', actividad: 'Gestión de clientes y facturación', finalidad: 'Ejecutar contratos de servicio, facturar y cobrar.', area: 'Comercial', resp: 'am', base: 'Ejecución de contrato', titulares: 'Representantes y contactos de clientes', datos: 'Identificación, contacto, datos tributarios y de pago', sensibles: false, transferencia: null, encargados: 'Proveedor de ERP en la nube', sistemas: 'ERP, CRM', conservacion: 'Vigencia del contrato + 6 años', seguridad: 'Control de accesos por rol, cifrado en tránsito y reposo, respaldo diario', riesgo: 'Bajo', eipd: 'No requiere evaluación de impacto: tratamiento de bajo riesgo y volumen acotado.', evidencias: [ev('Ficha_TR01_aprobada.pdf', 'pdf', -120, 'cs')] },
    { id: 'TR-02', actividad: 'Seguimiento de despachos para destinatarios', finalidad: 'Informar el estado de envíos y coordinar entregas.', area: 'Operaciones', resp: 'jo', base: 'Ejecución de contrato (con el cliente remitente)', titulares: 'Destinatarios finales de envíos', datos: 'Nombre, dirección, teléfono, firma de recepción', sensibles: false, transferencia: null, encargados: 'Plataforma de mensajería SMS', sistemas: 'Sistema de gestión de transporte, app de reparto', conservacion: '24 meses desde la entrega', seguridad: 'Enmascaramiento de teléfono en app, accesos por perfil', riesgo: 'Medio', eipd: 'Evaluación simplificada realizada: volumen alto de titulares; se definió minimización de datos en la app de reparto.', evidencias: [ev('EIPD_simplificada_TR02.pdf', 'pdf', -90, 'cs')] },
    { id: 'TR-03', actividad: 'Telemetría y geolocalización de conductores', finalidad: 'Seguridad vial, control de rutas y eficiencia de flota.', area: 'Operaciones', resp: 'jo', base: 'Interés legítimo (en evaluación)', titulares: 'Conductores propios y de contratistas', datos: 'Ubicación GPS, velocidad, eventos de conducción, identificación del conductor', sensibles: false, transferencia: 'Estados Unidos', encargados: 'Proveedor de telemetría', sistemas: 'Plataforma de telemetría', conservacion: '12 meses', seguridad: 'Acceso restringido a jefatura de flota, logs de consulta', riesgo: 'Alto', eipd: 'Evaluación de impacto en curso (actividad B-07): monitoreo sistemático de trabajadores y transferencia internacional. Pendiente definir garantías del proveedor y aviso a trabajadores.', evidencias: [] },
    { id: 'TR-04', actividad: 'Control de asistencia con huella digital', finalidad: 'Registro de jornada laboral.', area: 'Personas', resp: 'fh', base: 'Cumplimiento de obligación legal (jornada) — dato biométrico requiere revisión', titulares: 'Trabajadores', datos: 'Identificación, huella dactilar (plantilla), marcas de asistencia', sensibles: 'Sí — dato biométrico', transferencia: null, encargados: 'Proveedor de relojes control', sistemas: 'Sistema de asistencia', conservacion: 'Vigencia de la relación laboral + 5 años (marcas); plantilla biométrica hasta el término', seguridad: 'Plantilla cifrada en el dispositivo, sin almacenamiento de imagen', riesgo: 'Alto', eipd: 'Requiere evaluación de impacto por tratarse de datos sensibles. Se evalúa alternativa sin biometría para quien la solicite.', evidencias: [ev('Contrato_proveedor_asistencia.pdf', 'pdf', -300, 'fh')] },
    { id: 'TR-05', actividad: 'Selección y reclutamiento', finalidad: 'Evaluar postulantes para cargos vacantes.', area: 'Personas', resp: 'fh', base: 'Consentimiento del postulante', titulares: 'Postulantes', datos: 'CV, antecedentes académicos y laborales, referencias', sensibles: false, transferencia: null, encargados: 'Portal de empleo', sistemas: 'Portal de reclutamiento', conservacion: '12 meses desde el cierre del proceso', seguridad: 'Acceso solo para equipo de selección', riesgo: 'Medio', eipd: 'No requiere evaluación de impacto.', evidencias: [ev('Aviso_privacidad_postulantes.pdf', 'pdf', -80, 'cs')] },
    { id: 'TR-06', actividad: 'Videovigilancia de bodegas y patios', finalidad: 'Seguridad de instalaciones y mercadería.', area: 'Operaciones', resp: 'jo', base: 'Interés legítimo', titulares: 'Trabajadores, visitas, transportistas', datos: 'Imagen', sensibles: false, transferencia: null, encargados: 'Empresa de seguridad', sistemas: 'CCTV', conservacion: '30 días salvo incidente', seguridad: 'Grabaciones en servidor local con acceso registrado', riesgo: 'Medio', eipd: 'Evaluación simplificada realizada; se instalaron avisos visibles.', evidencias: [ev('Fotos_avisos_CCTV.png', 'png', -60, 'jo')] },
    { id: 'TR-07', actividad: 'Remuneraciones y salud ocupacional', finalidad: 'Pago de remuneraciones, cotizaciones y gestión de licencias médicas.', area: 'Personas', resp: 'fh', base: 'Cumplimiento de obligación legal', titulares: 'Trabajadores y cargas', datos: 'Identificación, datos bancarios, previsión, licencias médicas', sensibles: 'Sí — datos de salud', transferencia: null, encargados: 'Proveedor de remuneraciones', sistemas: 'Sistema de remuneraciones', conservacion: 'Según plazos legales laborales y previsionales', seguridad: 'Acceso restringido, cifrado, registro de accesos', riesgo: 'Alto', eipd: 'Evaluación de impacto completada; medidas implementadas.', evidencias: [ev('EIPD_remuneraciones.pdf', 'pdf', -150, 'cs')] },
    { id: 'TR-08', actividad: 'Marketing y newsletter', finalidad: 'Envío de novedades comerciales a contactos de clientes y prospectos.', area: 'Comercial', resp: 'am', base: 'Consentimiento', titulares: 'Contactos comerciales', datos: 'Nombre, correo, empresa, interacciones con correos', sensibles: false, transferencia: 'Estados Unidos', encargados: 'Plataforma de email marketing', sistemas: 'CRM, plataforma de email', conservacion: 'Hasta revocación del consentimiento', seguridad: 'Doble opt-in, enlace de baja en cada envío', riesgo: 'Bajo', eipd: 'No requiere evaluación de impacto.', evidencias: [ev('Registro_consentimientos_newsletter.xlsx', 'xlsx', -15, 'am')] }
  ];
  function sol(id, derecho, canal, titular, off, resp, estado) { return { id: id, derecho: derecho, canal: canal, titular: titular, fecha: d(off), vence: d(off + 30), resp: resp, estado: estado }; }
  var solicitudes = [
    sol('SD-' + Y + '-024', 'Supresión', 'Formulario web', 'Destinatario de envíos · ID 58-0193', -27, 'cs', 'En trámite'),
    sol('SD-' + Y + '-023', 'Acceso', 'Correo DPD', 'Ex trabajador · ID 11-4420', -22, 'fh', 'En trámite'),
    sol('SD-' + Y + '-022', 'Oposición', 'Formulario web', 'Contacto comercial · ID 73-2210', -12, 'am', 'En trámite'),
    sol('SD-' + Y + '-021', 'Rectificación', 'Formulario web', 'Cliente · ID 20-9917', -5, 'am', 'En trámite'),
    sol('SD-' + Y + '-020', 'Portabilidad', 'Correo DPD', 'Cliente · ID 20-4471', -45, 'cs', 'Respondida'),
    sol('SD-' + Y + '-019', 'Acceso', 'Formulario web', 'Conductor contratista · ID 31-0072', -60, 'jo', 'Respondida'),
    sol('SD-' + Y + '-018', 'Supresión', 'Formulario web', 'Postulante · ID 44-1189', -75, 'fh', 'Respondida')
  ];
  var brechas = [
    { id: 'INC-' + Y + '-03', titulo: 'Correo con planilla de destinatarios enviado a cliente equivocado', detalle: 'Planilla con 312 registros de nombre, dirección y teléfono.', fecha: d(-18), afectados: '312 titulares', evaluacion: 'Riesgo bajo: destinatario confirmó eliminación por escrito', estado: 'Cerrado' },
    { id: 'INC-' + Y + '-04', titulo: 'Acceso de cuenta de ex colaborador a sistema de despacho', detalle: 'Cuenta activa 12 días después de la desvinculación; se registraron 2 inicios de sesión.', fecha: d(-6), afectados: 'En evaluación', evaluacion: 'En análisis forense; evaluación de comunicación a la autoridad y a titulares', estado: 'En gestión' }
  ];

  // ---------- Obligaciones (matriz de cumplimiento) ----------
  function ob(titulo, detalle, ambito, ref, resp, estado) { return { titulo: titulo, detalle: detalle, ambito: ambito, ref: ref, resp: resp, estado: estado }; }
  var obligaciones = [
    ob('Base de licitud para cada tratamiento', 'Cada actividad del RAT tiene una base de licitud identificada y documentada.', 'Protección de datos', 'Ley 21.719 · Licitud del tratamiento', 'cs', 'Parcial'),
    ob('Deber de información y transparencia', 'Política de tratamiento publicada y avisos de privacidad en todos los puntos de captura.', 'Protección de datos', 'Ley 21.719 · Principio de transparencia', 'ip', 'Cumple'),
    ob('Registro de actividades de tratamiento', 'Inventario actualizado de tratamientos con finalidad, categorías, plazos y encargados.', 'Protección de datos', 'Ley 21.719 · Responsabilidad proactiva', 'cs', 'Cumple'),
    ob('Atención de derechos del titular', 'Canal y procedimiento para acceso, rectificación, supresión, oposición, portabilidad y bloqueo.', 'Protección de datos', 'Ley 21.719 · Derechos del titular', 'cs', 'Cumple'),
    ob('Minimización y plazos de conservación', 'Tablas de retención definidas y aplicadas en sistemas.', 'Protección de datos', 'Ley 21.719 · Principios de proporcionalidad y calidad', 'tv', 'Parcial'),
    ob('Medidas de seguridad', 'Controles técnicos y organizativos proporcionales al riesgo.', 'Protección de datos', 'Ley 21.719 · Deber de seguridad', 'tv', 'Parcial'),
    ob('Gestión y comunicación de vulneraciones', 'Protocolo para evaluar y comunicar brechas a la autoridad y a los titulares cuando corresponda.', 'Protección de datos', 'Ley 21.719 · Reporte de vulneraciones', 'tv', 'No cumple'),
    ob('Evaluación de impacto en tratamientos de alto riesgo', 'EIPD para tratamientos masivos, sensibles o de monitoreo sistemático.', 'Protección de datos', 'Ley 21.719 · Evaluación de impacto', 'cs', 'Parcial'),
    ob('Contratos con encargados del tratamiento', 'Cláusulas de tratamiento por cuenta de terceros con todos los proveedores que acceden a datos.', 'Protección de datos', 'Ley 21.719 · Encargado del tratamiento', 'ip', 'Parcial'),
    ob('Transferencias internacionales', 'Garantías documentadas para proveedores fuera de Chile.', 'Protección de datos', 'Ley 21.719 · Transferencia internacional', 'ip', 'No cumple'),
    ob('Delegado de protección de datos', 'Designación formal, funciones y recursos definidos.', 'Protección de datos', 'Ley 21.719 · Modelo de prevención de infracciones', 'mf', 'Cumple'),
    ob('Encargado de Prevención designado por el Directorio', 'Designación con autonomía, medios y acceso directo al Directorio.', 'Prevención de delitos', 'Ley 20.393 · Modelo de prevención', 'mf', 'Cumple'),
    ob('Matriz de riesgos actualizada', 'Identificación de actividades o procesos en que se genere o incremente el riesgo de delitos.', 'Prevención de delitos', 'Ley 20.393 · Identificación de riesgos', 'vr', 'Cumple'),
    ob('Protocolos y procedimientos de prevención', 'Controles documentados para los procesos de riesgo.', 'Prevención de delitos', 'Ley 20.393 · Protocolos y procedimientos', 'vr', 'Parcial'),
    ob('Reportes del EPD al Directorio', 'Reporte al menos semestral del funcionamiento del modelo.', 'Prevención de delitos', 'Ley 20.393 · Supervisión', 'vr', 'Cumple'),
    ob('Evaluación periódica por tercero independiente', 'Certificación o evaluación externa del modelo.', 'Prevención de delitos', 'Ley 20.393 · Supervisión y mejora', 'vr', 'Parcial'),
    ob('Canal de denuncias anónimo y confidencial', 'Disponible para colaboradores y terceros, con protección contra represalias.', 'Canal de denuncias', 'Ley 20.393 · Canales de denuncia', 'vr', 'Cumple'),
    ob('Procedimiento de investigación con plazos', 'Etapas, plazos, recusación y sanciones definidas.', 'Canal de denuncias', 'Procedimiento interno de denuncias', 'vr', 'Cumple'),
    ob('Procedimiento de acoso laboral y sexual', 'Protocolo de prevención e investigación vigente y difundido.', 'Canal de denuncias', 'Ley 21.643', 'fh', 'Cumple'),
    ob('Capacitación anual MPD', 'Cobertura mínima de 95% del personal.', 'Capacitación y cultura', 'Ley 20.393 · Difusión y capacitación', 'vr', 'Parcial'),
    ob('Capacitación en protección de datos', 'Áreas que tratan datos personales capacitadas.', 'Capacitación y cultura', 'Ley 21.719 · Responsabilidad proactiva', 'cs', 'No cumple'),
    ob('Código de Ética difundido y firmado', 'Recepción firmada por todo el personal.', 'Capacitación y cultura', 'Política interna', 'fh', 'Cumple')
  ];
  var ambitos = ['Prevención de delitos', 'Protección de datos', 'Canal de denuncias', 'Capacitación y cultura'];

  // ---------- Capacitación ----------
  var capacitaciones = [
    { curso: 'Modelo de Prevención de Delitos — anual', norma: 'Ley 20.393', publico: 'Todo el personal', modalidad: 'E-learning', limite: d(-200), inscritos: 418, aprobados: 339 },
    { curso: 'Prevención de delitos para turnos de bodega', norma: 'Ley 20.393', publico: 'Operarios de bodega', modalidad: 'Presencial', limite: d(20), inscritos: 86, aprobados: 31 },
    { curso: 'Anticorrupción en licitaciones públicas', norma: 'Ley 20.393', publico: 'Comercial y Legal', modalidad: 'Taller', limite: d(-60), inscritos: 14, aprobados: 14 },
    { curso: 'Protección de datos personales — fundamentos', norma: 'Ley 21.719', publico: 'Áreas que tratan datos', modalidad: 'E-learning', limite: d(50), inscritos: 120, aprobados: 0 },
    { curso: 'Prevención del acoso laboral y sexual', norma: 'Ley 21.643', publico: 'Todo el personal', modalidad: 'E-learning', limite: d(-30), inscritos: 418, aprobados: 401 }
  ];

  // ---------- Documentos ----------
  var documentos = [
    { id: 'DOC-01', nombre: 'Modelo de Prevención de Delitos', tipo: 'Manual', version: '3.1', aprobado: 'Directorio', revision: d(110) },
    { id: 'DOC-02', nombre: 'Código de Ética y Conducta', tipo: 'Política', version: '2.0', aprobado: 'Directorio', revision: d(190) },
    { id: 'DOC-03', nombre: 'Procedimiento de denuncias e investigación', tipo: 'Procedimiento', version: '2.2', aprobado: 'Comité de Ética', revision: d(40) },
    { id: 'DOC-04', nombre: 'Política de regalos e invitaciones', tipo: 'Política', version: '1.3', aprobado: 'Gerencia General', revision: d(-15) },
    { id: 'DOC-05', nombre: 'Política de tratamiento de datos personales', tipo: 'Política', version: '1.0', aprobado: 'Directorio', revision: d(260) },
    { id: 'DOC-06', nombre: 'Procedimiento de atención de derechos ARCOP', tipo: 'Procedimiento', version: '1.0', aprobado: 'Gerencia General', revision: d(280) },
    { id: 'DOC-07', nombre: 'Manual de gestión de riesgos', tipo: 'Manual', version: '2.0', aprobado: 'Comité de Riesgos', revision: d(150) },
    { id: 'DOC-08', nombre: 'Protocolo de prevención del acoso laboral y sexual', tipo: 'Protocolo', version: '1.1', aprobado: 'Gerencia General', revision: d(300) }
  ];

  // ---------- Alertas (coherentes con los datos de arriba) ----------
  var alertas = [
    { id: 'AL-01', tipo: 'denuncia', sev: 'Media', titulo: 'Nueva denuncia DEN-' + Y + '-011', detalle: 'Conflicto de interés en adjudicación de transporte. Plazo de admisibilidad: 2 días.', fecha: d(-3), link: '#/denuncias/DEN-' + Y + '-011', leida: false },
    { id: 'AL-02', tipo: 'vencimiento', sev: 'Alta', titulo: 'Etapa vencida en DEN-' + Y + '-009', detalle: 'La investigación superó el plazo de la etapa. Registre prórroga fundada o avance el caso.', fecha: d(-1), link: '#/denuncias/DEN-' + Y + '-009', leida: false },
    { id: 'AL-03', tipo: 'riesgo', sev: 'Alta', titulo: 'Control inefectivo eleva riesgo R-001', detalle: 'C-PR-11 (relación con funcionarios públicos) fue evaluado como inefectivo. Riesgo residual de cohecho en permisos municipales: Alto.', fecha: d(-100), link: '#/riesgos/R-001', leida: false },
    { id: 'AL-04', tipo: 'vencimiento', sev: 'Alta', titulo: 'Actividad atrasada: cláusulas MPD en proveedores', detalle: 'Venció hace 15 días. Responsable: Ignacia Pizarro.', fecha: d(-15), link: '#/planes/PM-MPD?act=A-06', leida: false },
    { id: 'AL-05', tipo: 'datos', sev: 'Alta', titulo: 'Solicitud de supresión vence en 3 días', detalle: 'SD-' + Y + '-024 · plazo de respuesta configurado en 30 días corridos.', fecha: d(0), link: '#/datos?tab=derechos', leida: false },
    { id: 'AL-06', tipo: 'evidencia', sev: 'Media', titulo: 'Control sin evidencia del período', detalle: 'C-PR-11 no registra bitácora de reuniones con autoridades.', fecha: d(-7), link: '#/controles/C-PR-11', leida: false },
    { id: 'AL-07', tipo: 'vencimiento', sev: 'Media', titulo: 'Prueba de control por vencer: C-PR-16', detalle: 'Monitoreo de transacciones con clientes: prueba programada en 5 días.', fecha: d(-2), link: '#/controles/C-PR-16', leida: false },
    { id: 'AL-08', tipo: 'datos', sev: 'Alta', titulo: 'Incidente INC-' + Y + '-04 en evaluación', detalle: 'Acceso de cuenta de ex colaborador. Evaluar comunicación a la autoridad y a titulares.', fecha: d(-6), link: '#/datos?tab=brechas', leida: false },
    { id: 'AL-09', tipo: 'evidencia', sev: 'Baja', titulo: 'Documento con revisión vencida', detalle: 'Política de regalos e invitaciones (v1.3) superó su fecha de revisión.', fecha: d(-15), link: '#/documentos', leida: true },
    { id: 'AL-10', tipo: 'regulatoria', sev: 'Media', titulo: 'Revisión anual de la matriz en curso', detalle: 'La matriz de riesgos debe actualizarse al menos una vez al año o ante cambios normativos o del negocio.', fecha: d(-40), link: '#/planes/PM-MPD?act=A-04', leida: true }
  ];
  // Alertas regulatorias de contexto: solo se muestran mientras sean vigentes (mismo texto que el sitio).
  var vigencia21719 = new Date(2026, 11, 1);
  if (hoy < vigencia21719) {
    alertas.splice(2, 0, { id: 'AL-R1', tipo: 'regulatoria', sev: 'Alta', titulo: 'Ley 21.719: entrada en vigor el 1 de diciembre de 2026', detalle: 'Fecha vigente a la espera del resultado del proyecto que propone postergarla al 1 de diciembre de 2027. Revise el avance del programa de adecuación.', fecha: d(-1), link: '#/planes/PM-DP', leida: false });
  }

  window.DEMO = {
    hoy: hoy,
    logo: 'https://witpublicimages.blob.core.windows.net/public/FOTOSREGULATEC/regulatecLogo.png',
    ctaUrl: '/#diagnostico',
    org: { nombre: 'Cordillera Logística Demo S.A.', rut: '99.999.999-9', rubro: 'Logística y distribución' },
    personas: personas,
    usuariosDemo: [
      { id: 'vr', perfil: 'Encargada de Prevención de Delitos' },
      { id: 'cs', perfil: 'Delegado de Protección de Datos' },
      { id: 'mf', perfil: 'Gerenta General · vista ejecutiva' }
    ],
    escala: escala, efectividad: efectividad, frecuenciaDias: frecuenciaDias,
    familias: familias, riesgos: riesgos, controles: controles, controlesById: controlesById,
    planes: planes, etapasDenuncia: etapasDenuncia, categoriasDenuncia: categoriasDenuncia, denuncias: denuncias,
    kpiDenuncias: { anio: 11, diasCierre: 24, objetivo: 30 },
    rat: rat, solicitudes: solicitudes, brechas: brechas,
    plazoDerechos: '30 días corridos desde la recepción, prorrogables una vez por igual período',
    obligaciones: obligaciones, ambitos: ambitos, capacitaciones: capacitaciones, documentos: documentos, alertas: alertas,
    reportes: [
      { id: 'dir', nombre: 'Informe semestral al Directorio', desc: 'Estado del Modelo de Prevención: matriz, controles, denuncias, planes y recomendaciones.', icon: 'chart' },
      { id: 'ejec', nombre: 'Resumen ejecutivo de cumplimiento', desc: 'Indicadores clave por ámbito para gerencia general.', icon: 'home' },
      { id: 'dp', nombre: 'Estado de adecuación Ley 21.719', desc: 'Obligaciones, registro de tratamientos, derechos e incidentes.', icon: 'lock' },
      { id: 'den', nombre: 'Reporte del canal de denuncias', desc: 'Casos por categoría, etapa, plazos y tiempos de cierre.', icon: 'msg' },
      { id: 'mat', nombre: 'Matriz de riesgos y controles', desc: 'Matriz completa con evaluación inherente y residual.', icon: 'risk' },
      { id: 'evi', nombre: 'Paquete de evidencia para auditoría', desc: 'Índice de evidencias por control y período.', icon: 'doc' }
    ],
    recomendaciones: [
      'Rediseñar el control C-PR-11 (bitácora de reuniones con autoridades) e incorporarlo al flujo de agenda.',
      'Cerrar la brecha de capacitación MPD en turnos de bodega antes del próximo informe al Directorio.',
      'Completar la evaluación de impacto de telemetría de conductores y documentar garantías de transferencia internacional.',
      'Aprobar el protocolo de gestión de vulneraciones de seguridad y realizar un simulacro.',
      'Regularizar cláusulas MPD y anexos de tratamiento de datos en contratos de proveedores.'
    ]
  };
})();
