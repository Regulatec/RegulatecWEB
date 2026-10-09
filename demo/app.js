/* RegulaTec — Demo navegable (SPA sin dependencias). Todos los datos vienen de data.js y son ficticios. */
(function () {
  'use strict';
  var D = window.DEMO;
  var root = document.getElementById('root');
  var modal = document.getElementById('modal');
  var overlay = document.getElementById('overlay');
  var state = { user: null, hint: true };

  // ---------- Utilidades ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fecha(d) { return d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); }
  function fechaCorta(d) { return d.getDate() + ' ' + MESES[d.getMonth()]; }
  function diasHasta(d) { return Math.round((d - D.hoy) / 86400000); }
  function relativo(d) {
    var n = diasHasta(d);
    if (n === 0) return 'hoy';
    if (n === 1) return 'mañana';
    if (n === -1) return 'ayer';
    return n > 0 ? 'en ' + n + ' días' : 'hace ' + (-n) + ' días';
  }
  function persona(id) { return D.personas[id] || { nombre: id, cargo: '', ini: '?' }; }
  function quien(id) { var p = persona(id); return '<span style="display:inline-flex;gap:8px;align-items:center"><span class="avatar avatar--sm">' + esc(p.ini) + '</span>' + esc(p.nombre) + '</span>'; }
  function pill(text, color) { return '<span class="pill p-' + color + '">' + esc(text) + '</span>'; }
  function toast(html) {
    var t = document.getElementById('toast');
    t.innerHTML = html; t.classList.add('is-on');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }

  var ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
    risk: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    bell: '<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 004 0"/>',
    msg: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    doc: '<path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    out: '<path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    law: '<path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 006 0zM17 7l-3 7a3 3 0 006 0zM8 21h8"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>'
  };
  function ic(name, size) { return '<svg class="i" viewBox="0 0 24 24"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '>' + ICON[name] + '</svg>'; }

  // ---------- Dominio ----------
  function nivel(score) { for (var i = 0; i < D.escala.niveles.length; i++) { if (score <= D.escala.niveles[i].max) return D.escala.niveles[i]; } return D.escala.niveles[D.escala.niveles.length - 1]; }
  function nivelPill(score) { var n = nivel(score); return pill(n.nombre + ' · ' + score, n.color); }
  function residual(r) {
    // Mitigación según efectividad promedio de los controles asociados (metodología simplificada de la demo).
    var ctrls = r.controles.map(function (c) { return D.controlesById[c]; }).filter(Boolean);
    var ef = ctrls.length ? ctrls.reduce(function (a, c) { return a + D.efectividad[c.efectividad].factor; }, 0) / ctrls.length : 0;
    // Los controles reducen sobre todo la probabilidad; el impacto solo baja con controles plenamente efectivos.
    var p = Math.max(1, r.prob - Math.round(ef * 1.5)); var i = Math.max(1, r.imp - (ef >= 0.9 ? 1 : 0));
    return { prob: p, imp: i, score: p * i };
  }
  function estadoControl(c) {
    var n = diasHasta(c.proximaPrueba);
    if (c.efectividad === 'Inefectivo') return { t: 'Inefectivo', c: 'red' };
    if (n < 0) return { t: 'Prueba vencida', c: 'red' };
    if (n <= 15) return { t: 'Por vencer', c: 'amber' };
    if (c.efectividad === 'Parcialmente efectivo') return { t: 'Con observaciones', c: 'amber' };
    return { t: 'Vigente', c: 'green' };
  }
  function estadoAct(a) {
    if (a.estado === 'Completada') return { t: 'Completada', c: 'green', bar: 'gb-done' };
    if (diasHasta(a.fin) < 0) return { t: 'Atrasada', c: 'red', bar: 'gb-late' };
    if (a.estado === 'En curso') return { t: 'En curso', c: 'blue', bar: 'gb-prog' };
    return { t: 'Planificada', c: 'gray', bar: 'gb-plan' };
  }
  function estadoSolicitud(s) {
    if (s.estado === 'Respondida') return { t: 'Respondida', c: 'green' };
    var n = diasHasta(s.vence);
    if (n < 0) return { t: 'Fuera de plazo', c: 'red' };
    if (n <= 7) return { t: 'Vence ' + relativo(s.vence), c: 'amber' };
    return { t: 'En trámite', c: 'blue' };
  }
  function alertasNoLeidas() { return D.alertas.filter(function (a) { return !a.leida; }).length; }
  function denunciasAbiertas() { return D.denuncias.filter(function (d) { return d.etapa < D.etapasDenuncia.length - 1; }).length; }
  function todasActividades() {
    var out = [];
    D.planes.forEach(function (p) { p.fases.forEach(function (f) { f.actividades.forEach(function (a) { out.push({ plan: p, fase: f, a: a }); }); }); });
    return out;
  }
  function avancePlan(p) {
    var acts = []; p.fases.forEach(function (f) { acts = acts.concat(f.actividades); });
    var done = acts.filter(function (a) { return a.estado === 'Completada'; }).length;
    return { total: acts.length, done: done, pct: Math.round(done / acts.length * 100), atrasadas: acts.filter(function (a) { return estadoAct(a).t === 'Atrasada'; }).length };
  }
  function cumplimiento(ambito) {
    var obs = D.obligaciones.filter(function (o) { return !ambito || o.ambito === ambito; });
    var pts = obs.reduce(function (a, o) { return a + (o.estado === 'Cumple' ? 1 : o.estado === 'Parcial' ? .5 : 0); }, 0);
    return Math.round(pts / obs.length * 100);
  }

  // ---------- Login ----------
  function renderLogin() {
    document.title = 'Ingresar — Demo RegulaTec';
    var sel = D.usuariosDemo[0].id;
    root.innerHTML =
      '<div class="login">' +
      '<div class="login__brand">' +
      '<img src="' + D.logo + '" alt="RegulaTec by W-IT" />' +
      '<div class="login__claim"><h1>Explora la plataforma <em>Compliance 360°</em></h1>' +
      '<p>Navega como un usuario real por una empresa ficticia: riesgos, controles, planes de mantención, alertas, canal de denuncias, protección de datos y reportes.</p>' +
      '<ul><li>Matriz de riesgos Ley 20.393 con fichas de detalle</li><li>Planes de mantención y alertas de vencimiento</li><li>Registro de tratamientos y solicitudes de derechos (Ley 21.719)</li><li>Reportes ejecutivos para el directorio</li></ul></div>' +
      '<div class="login__foot">Entorno de demostración · RegulaTec by W-IT es una marca operada por W-IT Products SpA</div>' +
      '</div>' +
      '<div class="login__form"><form class="login__card" id="loginForm" autocomplete="off">' +
      '<h2>Ingresar</h2><p class="muted">Elige con qué perfil quieres recorrer la demo.</p>' +
      '<div class="demo-note">' + ic('info') + '<span><b>Entorno de demostración.</b> La empresa, las personas y todos los datos son ficticios. No ingreses información real: este acceso no requiere ni guarda contraseñas.</span></div>' +
      '<div class="roles" role="radiogroup">' + D.usuariosDemo.map(function (u) {
        var p = persona(u.id);
        return '<button type="button" class="role' + (u.id === sel ? ' is-on' : '') + '" data-u="' + u.id + '" role="radio" aria-checked="' + (u.id === sel) + '"><span class="avatar">' + esc(p.ini) + '</span><span><b>' + esc(p.nombre) + '</b><span>' + esc(u.perfil) + '</span></span></button>';
      }).join('') + '</div>' +
      '<div class="field"><label for="lu">Usuario</label><input id="lu" readonly value="' + esc(persona(sel).email) + '" /></div>' +
      '<div class="field"><label for="lp">Contraseña</label><input id="lp" type="password" readonly value="demo-demo" aria-describedby="lpn" /><span id="lpn" class="small muted">Precargada: es un acceso simulado.</span></div>' +
      '<button class="btn btn--gold btn--block" type="submit">Ingresar a la demo</button>' +
      '</form></div></div>';
    $$('.role').forEach(function (b) {
      b.addEventListener('click', function () {
        sel = b.getAttribute('data-u');
        $$('.role').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); });
        $('#lu').value = persona(sel).email;
      });
    });
    $('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = e.target.querySelector('button[type=submit]');
      btn.textContent = 'Validando acceso…'; btn.disabled = true;
      setTimeout(function () { state.user = sel; store('rt-demo-user', sel); location.hash = '#/inicio'; render(); }, 650);
    });
  }

  // ---------- Shell ----------
  var NAV = [
    { g: 'General' },
    { id: 'inicio', t: 'Panel ejecutivo', i: 'home' },
    { id: 'alertas', t: 'Alertas', i: 'bell', badge: alertasNoLeidas },
    { g: 'Prevención de delitos' },
    { id: 'riesgos', t: 'Matriz de riesgos', i: 'risk' },
    { id: 'controles', t: 'Controles', i: 'shield' },
    { id: 'planes', t: 'Planes de mantención', i: 'cal' },
    { id: 'denuncias', t: 'Canal de denuncias', i: 'msg', badge: denunciasAbiertas },
    { g: 'Protección de datos' },
    { id: 'datos', t: 'Ley 21.719', i: 'lock' },
    { g: 'Gestión' },
    { id: 'capacitacion', t: 'Capacitación', i: 'cap' },
    { id: 'documentos', t: 'Documentos', i: 'doc' },
    { id: 'reportes', t: 'Reportes', i: 'chart' }
  ];
  function shell(section, html) {
    var u = persona(state.user);
    var perfil = D.usuariosDemo.filter(function (x) { return x.id === state.user; })[0];
    root.innerHTML =
      '<div class="app">' +
      '<aside class="side" id="side"><div class="side__brand"><img src="' + D.logo + '" alt="RegulaTec" /><div class="side__org"><b>' + esc(D.org.nombre) + '</b>RUT ' + esc(D.org.rut) + ' · ' + esc(D.org.rubro) + '</div></div>' +
      '<nav aria-label="Módulos">' + NAV.map(function (n) {
        if (n.g) return '<div class="side__group">' + n.g + '</div>';
        var b = n.badge ? n.badge() : 0;
        return '<a href="#/' + n.id + '" class="' + (n.id === section ? 'is-on' : '') + '">' + ic(n.i) + n.t + (b ? '<span class="count">' + b + '</span>' : '') + '</a>';
      }).join('') + '</nav>' +
      '<div class="side__foot">Demo con datos ficticios.<br/>Fecha simulada: ' + fecha(D.hoy) + '</div></aside>' +
      '<div class="main">' +
      '<div class="ribbon">' + ic('info', 14) + '<span><b>Modo demo</b><span class="long"> · Empresa y datos ficticios. Los cambios que hagas se pierden al cerrar.</span></span><a href="' + D.ctaUrl + '" target="_top">Solicitar diagnóstico →</a></div>' +
      '<header class="top">' +
      '<button class="icon-btn top__menu" id="menuBtn" aria-label="Abrir menú">' + ic('menu') + '</button>' +
      '<form class="top__search" id="searchForm" role="search">' + ic('search', 16) + '<input id="q" placeholder="Buscar riesgo, control, denuncia, tratamiento…" aria-label="Buscar" /></form>' +
      '<div class="top__right">' +
      '<a class="icon-btn" href="#/alertas" aria-label="Alertas">' + ic('bell') + (alertasNoLeidas() ? '<span class="dot"></span>' : '') + '</a>' +
      '<button class="user" id="userBtn" title="Cerrar sesión"><span class="avatar">' + esc(u.ini) + '</span><div><b>' + esc(u.nombre) + '</b><span>' + esc(perfil ? perfil.perfil : u.cargo) + '</span></div></button>' +
      '<button class="icon-btn" id="logout" aria-label="Cerrar sesión" title="Cerrar sesión">' + ic('out') + '</button>' +
      '</div></header>' +
      '<main class="view" id="view">' + html + '</main></div></div>';
    $('#menuBtn').addEventListener('click', function () { $('#side').classList.toggle('is-open'); });
    $('#logout').addEventListener('click', logout);
    $('#userBtn').addEventListener('click', logout);
    $('#searchForm').addEventListener('submit', function (e) { e.preventDefault(); location.hash = '#/buscar/' + encodeURIComponent($('#q').value.trim()); });
    $('#view').scrollTop = 0;
  }
  function logout() { state.user = null; store('rt-demo-user', null); location.hash = '#/login'; render(); }
  function head(title, crumbs, actions) {
    return '<div class="view__head"><div>' + (crumbs ? '<div class="crumbs">' + crumbs + '</div>' : '') + '<h1>' + title + '</h1></div>' + (actions ? '<div style="display:flex;gap:8px;flex-wrap:wrap">' + actions + '</div>' : '') + '</div>';
  }
  function hint(text) {
    if (!state.hint) return '';
    return '<div class="hint">' + ic('info') + '<div>' + text + '</div><button id="hideHint" aria-label="Ocultar sugerencia">' + ic('x', 16) + '</button></div>';
  }
  function bindHint() { var b = $('#hideHint'); if (b) b.addEventListener('click', function () { state.hint = false; b.parentNode.remove(); }); }

  // ---------- Panel ejecutivo ----------
  function heatmap(lista, usarResidual) {
    var m = {};
    lista.forEach(function (r) { var v = usarResidual ? residual(r) : r; var k = v.prob + '-' + v.imp; m[k] = (m[k] || 0) + 1; });
    var h = '<div class="heat">';
    for (var p = 5; p >= 1; p--) {
      h += '<div class="heat__axis">' + p + '</div>';
      for (var i = 1; i <= 5; i++) {
        var n = m[p + '-' + i] || 0, s = p * i, lv = D.escala.niveles.indexOf(nivel(s)) + 1;
        var cls = s <= 3 ? 1 : s <= 6 ? 2 : s <= 10 ? 3 : s <= 15 ? 4 : 5;
        h += '<div class="heat__cell h' + cls + 'c' + (n ? '' : ' zero') + '" data-p="' + p + '" data-i="' + i + '" data-r="' + (usarResidual ? 1 : 0) + '" title="Probabilidad ' + p + ' × Impacto ' + i + ' = ' + s + ' (' + nivel(s).nombre + ')' + (n ? ' · ' + n + ' riesgo(s)' : '') + '" data-lv="' + lv + '">' + (n || '') + '</div>';
      }
    }
    h += '<div></div>';
    for (var j = 1; j <= 5; j++) h += '<div class="heat__axis">' + j + '</div>';
    return h + '</div><div class="legend"><span>Eje vertical: probabilidad · Eje horizontal: impacto</span>' + D.escala.niveles.map(function (n) { return '<span>' + pill(n.nombre, n.color) + '</span>'; }).join('') + '</div>';
  }
  function bindHeat() {
    $$('.heat__cell:not(.zero)').forEach(function (c) {
      c.addEventListener('click', function () { location.hash = '#/riesgos?p=' + c.dataset.p + '&i=' + c.dataset.i + '&r=' + c.dataset.r; });
    });
  }
  function viewInicio() {
    var altos = D.riesgos.filter(function (r) { return residual(r).score >= D.escala.umbralAlto; }).length;
    var ctrlProb = D.controles.filter(function (c) { return estadoControl(c).c !== 'green'; }).length;
    var acts = todasActividades();
    var proximas = acts.filter(function (x) { return x.a.estado !== 'Completada'; }).sort(function (a, b) { return a.a.fin - b.a.fin; }).slice(0, 6);
    var cg = cumplimiento();
    var ambitos = D.ambitos.map(function (a) { return { n: a, v: cumplimiento(a) }; });
    var alertas = D.alertas.filter(function (a) { return !a.leida; }).slice(0, 5);
    var html = head('Hola, ' + esc(persona(state.user).nombre.split(' ')[0]), 'Panel ejecutivo · ' + fecha(D.hoy), '<a class="btn btn--ghost btn--sm" href="#/reportes">' + ic('chart', 15) + ' Ver reportes</a>') +
      hint('<b>Tip:</b> todo es clicable. Abre una celda del mapa de calor, una alerta o una actividad para ver su ficha completa.') +
      '<div class="grid g-4" style="margin-bottom:16px">' +
      kpi('Cumplimiento global', cg + '%', '<span class="up">▲ 6 pts</span> vs. semestre anterior', '#/datos?tab=obligaciones') +
      kpi('Riesgos residuales altos', altos, 'de ' + D.riesgos.length + ' riesgos evaluados', '#/riesgos?min=' + D.escala.umbralAlto) +
      kpi('Controles con atención', ctrlProb, 'de ' + D.controles.length + ' controles del MPD', '#/controles?f=atencion') +
      kpi('Denuncias abiertas', denunciasAbiertas(), 'tiempo medio de cierre: ' + D.kpiDenuncias.diasCierre + ' días', '#/denuncias') +
      '</div>' +
      '<div class="grid g-21" style="margin-bottom:16px">' +
      '<div class="card"><div class="card__head"><h3>Cumplimiento por ámbito</h3><span class="small muted">Obligaciones evaluadas: ' + D.obligaciones.length + '</span></div><div class="card__body"><div class="bars">' +
      ambitos.map(function (a) { var col = a.v >= 80 ? 'var(--green)' : a.v >= 60 ? 'var(--gold)' : 'var(--red)'; return '<div class="bars__row"><span>' + esc(a.n) + '</span><div class="bar"><i style="width:' + a.v + '%;background:' + col + '"></i></div><b>' + a.v + '%</b></div>'; }).join('') +
      '</div></div></div>' +
      '<div class="card"><div class="card__head"><h3>Mapa de calor · riesgo residual</h3><a class="small" href="#/riesgos">Matriz →</a></div><div class="card__body">' + heatmap(D.riesgos, true) + '</div></div>' +
      '</div>' +
      '<div class="grid g-2">' +
      '<div class="card"><div class="card__head"><h3>Próximas actividades de mantención</h3><a class="small" href="#/planes">Planes →</a></div><div class="list">' +
      proximas.map(function (x) { var e = estadoAct(x.a); return '<div class="list__item" data-go="#/planes/' + x.plan.id + '?act=' + x.a.id + '"><div class="list__icon" style="background:var(--gold-soft);color:#7d6531">' + ic('cal', 16) + '</div><div class="list__main"><b>' + esc(x.a.nombre) + '</b><p>' + esc(x.plan.nombre) + ' · ' + esc(persona(x.a.resp).nombre) + '</p></div><div class="list__meta">' + pill(e.t, e.c) + '<div style="margin-top:4px">' + fechaCorta(x.a.fin) + ' · ' + relativo(x.a.fin) + '</div></div></div>'; }).join('') +
      '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Alertas sin leer</h3><a class="small" href="#/alertas">Todas →</a></div><div class="list">' +
      (alertas.length ? alertas.map(alertaItem).join('') : '<div class="empty">Sin alertas pendientes.</div>') +
      '</div></div></div>';
    shell('inicio', html); bindHint(); bindHeat(); bindGo(); bindAlertas();
  }
  function kpi(label, value, sub, href) { return '<a class="card kpi" href="' + href + '" style="color:inherit"><span class="kpi__label">' + label + '</span><span class="kpi__value">' + value + '</span><span class="kpi__sub">' + sub + '</span></a>'; }
  function bindGo() { $$('[data-go]').forEach(function (el) { el.addEventListener('click', function (e) { if (e.target.closest('button,a')) return; location.hash = el.getAttribute('data-go'); }); }); }

  // ---------- Alertas ----------
  var ALERTA_TIPO = {
    regulatoria: { i: 'law', bg: 'var(--blue-bg)', c: 'var(--blue)', t: 'Regulatoria' },
    vencimiento: { i: 'clock', bg: 'var(--amber-bg)', c: 'var(--amber)', t: 'Vencimiento' },
    evidencia: { i: 'doc', bg: 'var(--amber-bg)', c: 'var(--amber)', t: 'Evidencia' },
    denuncia: { i: 'msg', bg: 'var(--red-bg)', c: 'var(--red)', t: 'Denuncia' },
    riesgo: { i: 'risk', bg: 'var(--red-bg)', c: 'var(--red)', t: 'Riesgo' },
    datos: { i: 'lock', bg: 'var(--gold-soft)', c: '#7d6531', t: 'Datos personales' }
  };
  function alertaItem(a) {
    var t = ALERTA_TIPO[a.tipo];
    return '<div class="list__item' + (a.leida ? ' read' : '') + '" data-alert="' + a.id + '"><div class="list__icon" style="background:' + t.bg + ';color:' + t.c + '">' + ic(t.i, 16) + '</div><div class="list__main"><b>' + esc(a.titulo) + '</b><p>' + esc(a.detalle) + '</p></div><div class="list__meta">' + pill(a.sev, a.sev === 'Alta' ? 'red' : a.sev === 'Media' ? 'amber' : 'gray') + '<div style="margin-top:4px">' + relativo(a.fecha) + '</div></div></div>';
  }
  function bindAlertas() {
    $$('[data-alert]').forEach(function (el) {
      el.addEventListener('click', function () {
        var a = D.alertas.filter(function (x) { return x.id === el.getAttribute('data-alert'); })[0];
        a.leida = true; location.hash = a.link;
      });
    });
  }
  function viewAlertas(q) {
    var f = q.f || 'todas';
    var lista = D.alertas.filter(function (a) { return f === 'todas' || (f === 'noleidas' ? !a.leida : a.tipo === f); });
    var html = head('Alertas', '<a href="#/inicio">Inicio</a> / Alertas', '<button class="btn btn--ghost btn--sm" id="readAll">' + ic('check', 15) + ' Marcar todas como leídas</button>') +
      '<div class="card"><div class="toolbar"><select id="fa"><option value="todas">Todas las alertas</option><option value="noleidas">Sin leer</option>' +
      Object.keys(ALERTA_TIPO).map(function (k) { return '<option value="' + k + '">' + ALERTA_TIPO[k].t + '</option>'; }).join('') +
      '</select><span class="small muted grow">' + lista.length + ' alerta(s). Las alertas se generan automáticamente por vencimientos, evidencia faltante, nuevas denuncias y cambios normativos.</span></div><div class="list">' +
      (lista.length ? lista.map(alertaItem).join('') : '<div class="empty">No hay alertas para este filtro.</div>') + '</div></div>';
    shell('alertas', html);
    $('#fa').value = f;
    $('#fa').addEventListener('change', function () { location.hash = '#/alertas?f=' + this.value; });
    $('#readAll').addEventListener('click', function () { D.alertas.forEach(function (a) { a.leida = true; }); toast('Todas las alertas marcadas como <b>leídas</b>'); viewAlertas(q); });
    bindAlertas();
  }

  // ---------- Riesgos ----------
  function viewRiesgos(q) {
    var html = head('Matriz de riesgos de delitos', '<a href="#/inicio">Inicio</a> / Prevención de delitos', '<button class="btn btn--ghost btn--sm" data-export>' + ic('doc', 15) + ' Exportar Excel</button><button class="btn btn--navy btn--sm" data-new>+ Nuevo riesgo</button>') +
      hint('La matriz cruza cada <b>delito</b> de la Ley 20.393 con los <b>procesos</b> donde podría cometerse, evalúa probabilidad × impacto y lo vincula a sus <b>controles</b>. Haz clic en una fila para abrir la ficha.') +
      '<div class="card"><div class="toolbar"><input id="fq" placeholder="Buscar por delito, proceso o código…" />' +
      '<select id="ff"><option value="">Todas las familias</option>' + D.familias.map(function (f) { return '<option>' + esc(f.nombre) + '</option>'; }).join('') + '</select>' +
      '<select id="fn"><option value="">Todos los niveles (residual)</option>' + D.escala.niveles.map(function (n) { return '<option>' + n.nombre + '</option>'; }).join('') + '</select>' +
      '<span class="small muted" id="fc"></span></div><div class="table-wrap"><table class="t"><thead><tr><th>Código</th><th>Delito</th><th>Proceso</th><th>Responsable</th><th>Inherente</th><th>Controles</th><th>Residual</th></tr></thead><tbody id="tb"></tbody></table></div></div>';
    shell('riesgos', html); bindHint();
    function pinta() {
      var t = $('#fq').value.toLowerCase(), fam = $('#ff').value, nv = $('#fn').value;
      var rows = D.riesgos.filter(function (r) {
        var res = residual(r);
        if (q.p && (q.r === '1' ? res.prob : r.prob) != q.p) return false;
        if (q.i && (q.r === '1' ? res.imp : r.imp) != q.i) return false;
        if (q.min && res.score < +q.min) return false;
        if (fam && r.familia !== fam) return false;
        if (nv && nivel(res.score).nombre !== nv) return false;
        return !t || (r.id + r.codigo + r.delito + r.proceso + r.descripcion).toLowerCase().indexOf(t) >= 0;
      });
      $('#tb').innerHTML = rows.length ? rows.map(function (r) {
        var res = residual(r);
        return '<tr class="click" data-go="#/riesgos/' + r.id + '"><td><span class="code">' + r.id + '</span><br/><span class="tagx">' + r.codigo + '</span></td><td><b>' + esc(r.delito) + '</b><div class="small muted">' + esc(r.familia) + '</div></td><td>' + esc(r.proceso) + '</td><td>' + esc(persona(r.resp).nombre) + '</td><td>' + nivelPill(r.prob * r.imp) + '</td><td>' + r.controles.length + '</td><td>' + nivelPill(res.score) + '</td></tr>';
      }).join('') : '<tr><td colspan="7" class="empty">Sin resultados para el filtro.</td></tr>';
      $('#fc').textContent = rows.length + ' de ' + D.riesgos.length + ' riesgos' + (q.p || q.min ? ' (filtro desde el panel · ' : '') + (q.p || q.min ? 'limpiar en el menú)' : '');
      bindGo();
    }
    ['fq', 'ff', 'fn'].forEach(function (id) { $('#' + id).addEventListener('input', pinta); });
    pinta(); bindDemoButtons();
  }
  function viewRiesgo(id) {
    var r = D.riesgos.filter(function (x) { return x.id === id; })[0];
    if (!r) return notFound();
    var res = residual(r), inh = r.prob * r.imp;
    var ctrls = r.controles.map(function (c) { return D.controlesById[c]; });
    var html = head(esc(r.delito), '<a href="#/riesgos">Matriz de riesgos</a> / ' + r.id, '<button class="btn btn--ghost btn--sm" data-evid="' + r.id + '">' + ic('up', 15) + ' Adjuntar evidencia</button><button class="btn btn--navy btn--sm" data-eval>Reevaluar riesgo</button>') +
      '<div class="ficha"><div class="grid">' +
      '<div class="card"><div class="card__head"><h3>Ficha del riesgo</h3><span class="tagx">' + r.codigo + '</span></div><div class="card__body"><dl class="dl">' +
      '<dt>Familia</dt><dd>' + esc(r.familia) + '</dd><dt>Tipo penal</dt><dd>' + esc(r.delito) + '<div class="small muted">' + esc(r.norma) + '</div></dd>' +
      '<dt>Proceso</dt><dd>' + esc(r.proceso) + '</dd><dt>Área</dt><dd>' + esc(r.area) + '</dd>' +
      '<dt>Descripción del riesgo</dt><dd>' + esc(r.descripcion) + '</dd>' +
      '<dt>Señales de alerta</dt><dd>' + r.senales.map(esc).join('<br/>') + '</dd>' +
      '<dt>Dueño del riesgo</dt><dd>' + quien(r.resp) + '</dd></dl></div></div>' +
      '<div class="card"><div class="card__head"><h3>Controles mitigantes (' + ctrls.length + ')</h3><a class="small" href="#/controles">Ver todos →</a></div><div class="table-wrap"><table class="t"><thead><tr><th>Código</th><th>Control</th><th>Oportunidad</th><th>Frecuencia</th><th>Efectividad</th><th>Estado</th></tr></thead><tbody>' +
      ctrls.map(function (c) { var e = estadoControl(c); return '<tr class="click" data-go="#/controles/' + c.id + '"><td class="code">' + c.id + '</td><td>' + esc(c.titulo) + '</td><td>' + esc(c.oportunidad) + '</td><td>' + esc(c.frecuencia) + '</td><td>' + esc(c.efectividad) + '</td><td>' + pill(e.t, e.c) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="card"><div class="card__head"><h3>Historial de evaluaciones</h3></div><div class="card__body"><ul class="timeline">' +
      r.historial.map(function (h, k) { return '<li class="' + (k === 0 ? 'now' : 'done') + '"><b>' + esc(h.t) + '</b><span>' + fecha(h.f) + ' · ' + esc(persona(h.p).nombre) + '</span></li>'; }).join('') +
      '</ul></div></div></div>' +
      '<div class="grid">' +
      '<div class="card"><div class="card__head"><h3>Evaluación</h3></div><div class="card__body"><div class="score">' +
      '<div class="score__box"><small>Inherente</small><b>' + inh + '</b>' + pill(nivel(inh).nombre, nivel(inh).color) + '<div class="small muted" style="margin-top:6px">P' + r.prob + ' × I' + r.imp + '</div></div>' +
      '<div class="score__box"><small>Residual</small><b>' + res.score + '</b>' + pill(nivel(res.score).nombre, nivel(res.score).color) + '<div class="small muted" style="margin-top:6px">P' + res.prob + ' × I' + res.imp + '</div></div>' +
      '</div><p class="small muted" style="margin-top:12px">El residual se calcula aplicando la efectividad de los controles asociados sobre la evaluación inherente.</p></div></div>' +
      '<div class="card"><div class="card__head"><h3>Evidencias</h3></div><div class="card__body" id="evlist">' + filesHtml(r.evidencias) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Próxima revisión</h3></div><div class="card__body"><b>' + fecha(r.proximaRevision) + '</b><div class="small muted">' + relativo(r.proximaRevision) + ' · revisión ' + esc(D.escala.revision) + '</div></div></div>' +
      '</div></div>';
    shell('riesgos', html); bindGo(); bindDemoButtons(r.evidencias);
  }
  function filesHtml(list) {
    if (!list.length) return '<div class="small muted">Aún no hay evidencias cargadas.</div>';
    return list.map(function (f) { return '<div class="file"><span class="file__ext ext-' + f.ext + '">' + f.ext.toUpperCase() + '</span><div style="flex:1;min-width:0"><b style="font-weight:500;word-break:break-word">' + esc(f.n) + '</b><div class="small muted">' + fecha(f.f) + ' · ' + esc(persona(f.p).nombre) + '</div></div></div>'; }).join('');
  }
  function bindDemoButtons(evidList) {
    $$('[data-export]').forEach(function (b) { b.addEventListener('click', function () { toast('En la plataforma real se descarga el <b>Excel</b>. En la demo la exportación está deshabilitada.'); }); });
    $$('[data-new]').forEach(function (b) { b.addEventListener('click', function () { toast('Crear registros está disponible en la versión completa. <b>Solicita una demo guiada.</b>'); }); });
    $$('[data-eval]').forEach(function (b) { b.addEventListener('click', function () { toast('Se envió la solicitud de <b>reevaluación</b> al dueño del riesgo (simulado).'); }); });
    $$('[data-evid]').forEach(function (b) {
      b.addEventListener('click', function () {
        openModal('Adjuntar evidencia', '<div class="field"><label>Archivo</label><input type="text" id="evn" value="Evidencia_' + b.getAttribute('data-evid') + '_' + MESES[D.hoy.getMonth()] + D.hoy.getFullYear() + '.pdf" /></div><div class="field"><label>Descripción</label><textarea id="evd" rows="3">Respaldo de ejecución del control del período.</textarea></div><div class="demo-note">' + ic('info') + '<span>Simulación: no se sube ningún archivo. Se agrega un registro de ejemplo a la ficha.</span></div>',
          '<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--gold" id="evok">Registrar evidencia</button>');
        $('#evok').addEventListener('click', function () {
          var n = $('#evn').value.trim() || 'Evidencia.pdf';
          var ext = (n.split('.').pop() || 'pdf').toLowerCase(); if (!/^(pdf|xlsx|docx|png|msg)$/.test(ext)) ext = 'pdf';
          evidList.unshift({ n: n, ext: ext, f: D.hoy, p: state.user });
          closeModal(); $('#evlist').innerHTML = filesHtml(evidList); toast('Evidencia <b>registrada</b> con fecha y responsable');
        });
      });
    });
  }

  // ---------- Controles ----------
  function viewControles(q) {
    var html = head('Controles del Modelo de Prevención', '<a href="#/inicio">Inicio</a> / Prevención de delitos', '<button class="btn btn--ghost btn--sm" data-export>' + ic('doc', 15) + ' Exportar</button>') +
      '<div class="grid g-4" style="margin-bottom:16px">' + ['Vigente', 'Por vencer', 'Con observaciones', 'Prueba vencida'].map(function (s) {
        var n = D.controles.filter(function (c) { return estadoControl(c).t === s; }).length;
        return '<div class="card kpi" data-st="' + s + '"><span class="kpi__label">' + s + '</span><span class="kpi__value">' + n + '</span></div>';
      }).join('') + '</div>' +
      '<div class="card"><div class="toolbar"><input id="cq" placeholder="Buscar control…" /><select id="co"><option value="">Preventivo y detectivo</option><option>Preventivo</option><option>Detectivo</option></select><select id="cs"><option value="">Todos los estados</option><option>Vigente</option><option>Por vencer</option><option>Con observaciones</option><option>Prueba vencida</option><option>Inefectivo</option><option value="atencion">Requieren atención</option></select><span class="small muted" id="cc"></span></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Código</th><th>Control</th><th>Responsable</th><th>Oportunidad</th><th>Frecuencia</th><th>Próxima prueba</th><th>Estado</th></tr></thead><tbody id="ctb"></tbody></table></div></div>';
    shell('controles', html);
    if (q.f) $('#cs').value = q.f;
    function pinta() {
      var t = $('#cq').value.toLowerCase(), o = $('#co').value, s = $('#cs').value;
      var rows = D.controles.filter(function (c) {
        var e = estadoControl(c);
        if (o && c.oportunidad !== o) return false;
        if (s === 'atencion' ? e.c === 'green' : s && e.t !== s) return false;
        return !t || (c.id + c.titulo + c.detalle).toLowerCase().indexOf(t) >= 0;
      });
      $('#ctb').innerHTML = rows.map(function (c) { var e = estadoControl(c); return '<tr class="click" data-go="#/controles/' + c.id + '"><td class="code">' + c.id + '</td><td><b>' + esc(c.titulo) + '</b></td><td>' + esc(persona(c.resp).nombre) + '</td><td>' + esc(c.oportunidad) + '</td><td>' + esc(c.frecuencia) + '</td><td>' + fecha(c.proximaPrueba) + '<div class="small muted">' + relativo(c.proximaPrueba) + '</div></td><td>' + pill(e.t, e.c) + '</td></tr>'; }).join('') || '<tr><td colspan="7" class="empty">Sin resultados.</td></tr>';
      $('#cc').textContent = rows.length + ' de ' + D.controles.length;
      bindGo();
    }
    ['cq', 'co', 'cs'].forEach(function (id) { $('#' + id).addEventListener('input', pinta); });
    $$('[data-st]').forEach(function (k) { k.addEventListener('click', function () { $('#cs').value = k.dataset.st; pinta(); }); });
    pinta(); bindDemoButtons();
  }
  function viewControl(id) {
    var c = D.controlesById[id]; if (!c) return notFound();
    var e = estadoControl(c);
    var riesgos = D.riesgos.filter(function (r) { return r.controles.indexOf(c.id) >= 0; });
    var html = head(esc(c.titulo), '<a href="#/controles">Controles</a> / ' + c.id, '<button class="btn btn--ghost btn--sm" data-evid="' + c.id + '">' + ic('up', 15) + ' Adjuntar evidencia</button><button class="btn btn--navy btn--sm" id="testBtn">Registrar prueba</button>') +
      '<div class="ficha"><div class="grid">' +
      '<div class="card"><div class="card__head"><h3>Ficha del control</h3>' + pill(e.t, e.c) + '</div><div class="card__body"><dl class="dl">' +
      '<dt>Detalle</dt><dd>' + esc(c.detalle) + '</dd><dt>Oportunidad</dt><dd>' + esc(c.oportunidad) + '</dd><dt>Naturaleza</dt><dd>' + esc(c.naturaleza) + '</dd><dt>Frecuencia</dt><dd>' + esc(c.frecuencia) + '</dd>' +
      '<dt>Responsable</dt><dd>' + quien(c.resp) + '</dd><dt>Evidencia esperada</dt><dd>' + esc(c.evidenciaEsperada) + '</dd></dl></div></div>' +
      '<div class="card"><div class="card__head"><h3>Riesgos que mitiga (' + riesgos.length + ')</h3></div><div class="table-wrap"><table class="t"><tbody>' +
      riesgos.map(function (r) { return '<tr class="click" data-go="#/riesgos/' + r.id + '"><td class="code">' + r.id + '</td><td>' + esc(r.delito) + '<div class="small muted">' + esc(r.proceso) + '</div></td><td>' + nivelPill(residual(r).score) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="card"><div class="card__head"><h3>Pruebas de efectividad</h3></div><div class="table-wrap"><table class="t"><thead><tr><th>Fecha</th><th>Revisor</th><th>Resultado</th><th>Observación</th></tr></thead><tbody id="ptb">' + pruebasHtml(c) + '</tbody></table></div></div>' +
      '</div><div class="grid">' +
      '<div class="card"><div class="card__head"><h3>Calendario</h3></div><div class="card__body"><dl class="dl" style="grid-template-columns:1fr"><dt>Última prueba</dt><dd>' + fecha(c.ultimaPrueba) + '</dd><dt>Próxima prueba</dt><dd><b>' + fecha(c.proximaPrueba) + '</b> <span class="small muted">(' + relativo(c.proximaPrueba) + ')</span></dd><dt>Efectividad vigente</dt><dd>' + esc(c.efectividad) + '</dd></dl></div></div>' +
      '<div class="card"><div class="card__head"><h3>Evidencias</h3></div><div class="card__body" id="evlist">' + filesHtml(c.evidencias) + '</div></div>' +
      '</div></div>';
    shell('controles', html); bindGo(); bindDemoButtons(c.evidencias);
    $('#testBtn').addEventListener('click', function () {
      openModal('Registrar prueba de efectividad', '<div class="field"><label>Resultado</label><select id="tr"><option>Efectivo</option><option>Parcialmente efectivo</option><option>Inefectivo</option></select></div><div class="field"><label>Observación</label><textarea id="to" rows="3">Muestra revisada sin excepciones.</textarea></div>',
        '<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--gold" id="tok">Guardar prueba</button>');
      $('#tok').addEventListener('click', function () {
        c.pruebas.unshift({ f: D.hoy, p: state.user, r: $('#tr').value, o: $('#to').value });
        c.efectividad = $('#tr').value; c.ultimaPrueba = D.hoy;
        c.proximaPrueba = new Date(D.hoy.getTime() + D.frecuenciaDias[c.frecuencia] * 86400000);
        closeModal(); viewControl(id); toast('Prueba registrada. Próxima prueba programada para <b>' + fecha(c.proximaPrueba) + '</b>');
      });
    });
  }
  function pruebasHtml(c) { return c.pruebas.map(function (p) { return '<tr><td>' + fecha(p.f) + '</td><td>' + esc(persona(p.p).nombre) + '</td><td>' + pill(p.r, p.r === 'Efectivo' ? 'green' : p.r === 'Inefectivo' ? 'red' : 'amber') + '</td><td>' + esc(p.o) + '</td></tr>'; }).join(''); }

  // ---------- Planes de mantención ----------
  function viewPlanes() {
    var html = head('Planes de mantención', '<a href="#/inicio">Inicio</a> / Prevención de delitos', '') +
      hint('Los planes convierten las obligaciones en un <b>calendario anual de actividades</b> con responsable, plazo y evidencia. Cuando una actividad se acerca a su fecha o se atrasa, la plataforma genera una <b>alerta</b>.') +
      '<div class="grid g-2">' + D.planes.map(function (p) {
        var a = avancePlan(p);
        return '<a class="card" href="#/planes/' + p.id + '" style="color:inherit"><div class="card__head"><h3>' + esc(p.nombre) + '</h3><span class="tagx">' + esc(p.norma) + '</span></div><div class="card__body">' +
          '<p class="small muted" style="margin-bottom:14px">' + esc(p.descripcion) + '</p>' +
          '<div class="bars__row" style="grid-template-columns:1fr 44px"><div class="bar"><i style="width:' + a.pct + '%"></i></div><b>' + a.pct + '%</b></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + pill(a.done + '/' + a.total + ' completadas', 'green') + (a.atrasadas ? pill(a.atrasadas + ' atrasada(s)', 'red') : '') + pill('Responsable: ' + persona(p.resp).nombre, 'navy') + '</div></div></a>';
      }).join('') + '</div>';
    shell('planes', html); bindHint();
  }
  function viewPlan(id, q) {
    var p = D.planes.filter(function (x) { return x.id === id; })[0]; if (!p) return notFound();
    // Ventana móvil de 12 meses: 8 meses hacia atrás y 3 hacia adelante del mes actual.
    var a = avancePlan(p), base = D.hoy.getFullYear() * 12 + D.hoy.getMonth() - 8, NOW = 8;
    function idx(dt) { return dt.getFullYear() * 12 + dt.getMonth() - base; }
    var g = '<div class="gantt"><div class="gantt__h">Actividad</div>';
    for (var k = 0; k < 12; k++) { var mm = (base + k) % 12; g += '<div class="gantt__h' + (k === NOW ? ' now' : '') + '">' + MESES[mm] + (mm === 0 || k === 0 ? ' ' + String(Math.floor((base + k) / 12)).slice(2) : '') + '</div>'; }
    p.fases.forEach(function (f) {
      g += '<div class="gantt__phase">' + esc(f.nombre) + '</div>';
      f.actividades.forEach(function (ac) {
        var e = estadoAct(ac), mi = idx(ac.ini), mf = idx(ac.fin);
        g += '<div class="gantt__name" data-act="' + ac.id + '">' + esc(ac.nombre) + '<small>' + esc(persona(ac.resp).nombre) + ' · ' + e.t + '</small></div>';
        for (var m = 0; m < 12; m++) g += '<div class="gantt__cell' + (m === NOW ? ' now' : '') + '">' + (m >= mi && m <= mf ? '<span class="gantt__bar ' + e.bar + '" title="' + esc(ac.nombre) + '"></span>' : '') + '</div>';
      });
    });
    g += '</div>';
    var html = head(esc(p.nombre), '<a href="#/planes">Planes de mantención</a> / ' + p.id, '<button class="btn btn--ghost btn--sm" data-export>' + ic('doc', 15) + ' Exportar Gantt</button>') +
      '<div class="grid g-4" style="margin-bottom:16px">' +
      '<div class="card kpi"><span class="kpi__label">Avance</span><span class="kpi__value">' + a.pct + '%</span><div class="bar"><i style="width:' + a.pct + '%"></i></div></div>' +
      '<div class="card kpi"><span class="kpi__label">Completadas</span><span class="kpi__value">' + a.done + '</span><span class="kpi__sub">de ' + a.total + ' actividades</span></div>' +
      '<div class="card kpi"><span class="kpi__label">Atrasadas</span><span class="kpi__value' + (a.atrasadas ? ' down' : '') + '">' + a.atrasadas + '</span><span class="kpi__sub">generan alerta automática</span></div>' +
      '<div class="card kpi"><span class="kpi__label">Responsable del plan</span><span style="margin-top:6px">' + quien(p.resp) + '</span><span class="kpi__sub">' + esc(p.norma) + '</span></div></div>' +
      '<div class="card"><div class="card__head"><h3>Carta Gantt · últimos 8 meses y próximos 3</h3><div class="legend" style="margin:0"><span><i class="gb-done"></i>Completada</span><span><i class="gb-prog"></i>En curso</span><span><i class="gb-late"></i>Atrasada</span><span><i class="gb-plan"></i>Planificada</span></div></div><div class="table-wrap">' + g + '</div></div>';
    shell('planes', html); bindDemoButtons();
    $$('[data-act]').forEach(function (el) { el.addEventListener('click', function () { openActividad(p, el.getAttribute('data-act')); }); });
    if (q.act) openActividad(p, q.act);
  }
  function openActividad(p, actId) {
    var ac, fase; p.fases.forEach(function (f) { f.actividades.forEach(function (x) { if (x.id === actId) { ac = x; fase = f; } }); });
    if (!ac) return;
    var e = estadoAct(ac);
    openModal(esc(ac.nombre),
      '<div style="margin-bottom:14px">' + pill(e.t, e.c) + ' <span class="tagx">' + esc(fase.nombre) + '</span></div><dl class="dl">' +
      '<dt>Descripción</dt><dd>' + esc(ac.desc) + '</dd><dt>Responsable</dt><dd>' + quien(ac.resp) + '</dd>' +
      '<dt>Periodo</dt><dd>' + fecha(ac.ini) + ' → ' + fecha(ac.fin) + ' <span class="small muted">(' + relativo(ac.fin) + ')</span></dd>' +
      '<dt>Periodicidad</dt><dd>' + esc(ac.periodicidad) + '</dd><dt>Evidencia requerida</dt><dd>' + esc(ac.evidencia) + '</dd>' +
      '<dt>Recordatorios</dt><dd>Alerta automática 15 y 3 días antes del vencimiento, y escalamiento al Encargado de Prevención si se atrasa.</dd></dl>',
      '<button class="btn btn--ghost" data-close>Cerrar</button>' + (ac.estado === 'Completada' ? '' : '<button class="btn btn--gold" id="doneBtn">' + ic('check', 15) + ' Marcar como completada</button>'));
    var b = $('#doneBtn');
    if (b) b.addEventListener('click', function () { ac.estado = 'Completada'; closeModal(); viewPlan(p.id, {}); toast('Actividad <b>completada</b>. Se registró la fecha y el responsable.'); });
  }

  // ---------- Denuncias ----------
  function viewDenuncias() {
    var etapas = D.etapasDenuncia;
    var html = head('Canal de denuncias', '<a href="#/inicio">Inicio</a> / Prevención de delitos', '<button class="btn btn--ghost btn--sm" id="formPub">' + ic('msg', 15) + ' Ver formulario público</button>') +
      hint('Las denuncias ingresan por el formulario público (anónimo o identificado), se clasifican y avanzan por etapas con <b>plazos y bitácora trazable</b>. Solo el comité ve la identidad del denunciante cuando se informa.') +
      '<div class="grid g-4" style="margin-bottom:16px">' +
      '<div class="card kpi"><span class="kpi__label">Recibidas ' + D.hoy.getFullYear() + '</span><span class="kpi__value">' + D.kpiDenuncias.anio + '</span><span class="kpi__sub">' + D.denuncias.length + ' en la vista actual</span></div>' +
      '<div class="card kpi"><span class="kpi__label">Abiertas</span><span class="kpi__value">' + denunciasAbiertas() + '</span><span class="kpi__sub">en investigación o análisis</span></div>' +
      '<div class="card kpi"><span class="kpi__label">Anónimas</span><span class="kpi__value">' + Math.round(D.denuncias.filter(function (d) { return d.anonima; }).length / D.denuncias.length * 100) + '%</span><span class="kpi__sub">del total</span></div>' +
      '<div class="card kpi"><span class="kpi__label">Días promedio de cierre</span><span class="kpi__value">' + D.kpiDenuncias.diasCierre + '</span><span class="kpi__sub">objetivo: ≤ ' + D.kpiDenuncias.objetivo + ' días</span></div></div>' +
      '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Folio</th><th>Recepción</th><th>Categoría</th><th>Canal</th><th>Denunciante</th><th>Etapa</th><th>Plazo etapa</th><th>Prioridad</th></tr></thead><tbody>' +
      D.denuncias.map(function (d) {
        var fin = d.etapa === etapas.length - 1;
        return '<tr class="click" data-go="#/denuncias/' + d.id + '"><td class="code">' + d.id + '</td><td>' + fecha(d.fecha) + '</td><td>' + esc(d.categoria) + '</td><td>' + esc(d.canal) + '</td><td>' + (d.anonima ? 'Anónimo' : 'Identificado') + '</td><td>' + pill(etapas[d.etapa], fin ? 'green' : 'blue') + '</td><td>' + (fin ? '—' : fecha(d.plazo) + '<div class="small ' + (diasHasta(d.plazo) < 0 ? 'down' : 'muted') + '">' + relativo(d.plazo) + '</div>') + '</td><td>' + pill(d.prioridad, d.prioridad === 'Alta' ? 'red' : d.prioridad === 'Media' ? 'amber' : 'gray') + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
    shell('denuncias', html); bindHint(); bindGo();
    $('#formPub').addEventListener('click', function () {
      openModal('Formulario público de denuncias', '<p class="small muted" style="margin-bottom:14px">Vista previa del formulario que ven colaboradores y terceros. En la demo no se envía.</p>' +
        '<div class="field"><label>¿Desea identificarse?</label><select><option>No, deseo denunciar de forma anónima</option><option>Sí, deseo identificarme</option></select></div>' +
        '<div class="field"><label>Categoría</label><select>' + D.categoriasDenuncia.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Relato de los hechos</label><textarea rows="4" placeholder="Describa qué ocurrió, cuándo, dónde y quiénes participaron."></textarea></div>' +
        '<div class="field"><label>Adjuntos</label><input type="text" placeholder="(opcional) documentos, fotos, correos" /></div>' +
        '<div class="demo-note">' + ic('info') + '<span>Al enviar, el denunciante recibe un folio y una clave para seguir su caso sin revelar su identidad.</span></div>',
        '<button class="btn btn--ghost" data-close>Cerrar</button><button class="btn btn--gold" id="fpok">Enviar (simulado)</button>');
      $('#fpok').addEventListener('click', function () { closeModal(); toast('Denuncia de prueba enviada · folio <b>DEN-' + D.hoy.getFullYear() + '-0' + (D.kpiDenuncias.anio + 1) + '</b> (simulado)'); });
    });
  }
  function viewDenuncia(id) {
    var d = D.denuncias.filter(function (x) { return x.id === id; })[0]; if (!d) return notFound();
    var etapas = D.etapasDenuncia, fin = d.etapa === etapas.length - 1;
    var html = head('Denuncia ' + d.id, '<a href="#/denuncias">Canal de denuncias</a> / ' + d.id, fin ? '' : '<button class="btn btn--navy btn--sm" id="advBtn">Avanzar a: ' + esc(etapas[d.etapa + 1]) + '</button>') +
      '<div class="card" style="margin-bottom:16px"><div class="card__body"><div style="display:grid;grid-template-columns:repeat(' + etapas.length + ',1fr);gap:6px">' +
      etapas.map(function (e, k) { var col = k < d.etapa ? 'var(--gold)' : k === d.etapa ? 'var(--blue)' : '#e9e5dc'; return '<div><div style="height:6px;border-radius:3px;background:' + col + '"></div><div class="small" style="margin-top:6px;' + (k === d.etapa ? 'font-weight:700' : 'color:var(--ink3)') + '">' + esc(e) + '</div></div>'; }).join('') +
      '</div></div></div>' +
      '<div class="ficha"><div class="grid">' +
      '<div class="card"><div class="card__head"><h3>Antecedentes</h3>' + pill(d.prioridad + ' prioridad', d.prioridad === 'Alta' ? 'red' : d.prioridad === 'Media' ? 'amber' : 'gray') + '</div><div class="card__body"><dl class="dl">' +
      '<dt>Categoría</dt><dd>' + esc(d.categoria) + '</dd><dt>Delito asociado</dt><dd>' + (d.riesgo ? '<a href="#/riesgos/' + d.riesgo + '">' + esc(D.riesgos.filter(function (r) { return r.id === d.riesgo; })[0].delito) + ' (' + d.riesgo + ')</a>' : 'No aplica (falta a código de ética)') + '</dd>' +
      '<dt>Canal</dt><dd>' + esc(d.canal) + '</dd><dt>Denunciante</dt><dd>' + (d.anonima ? 'Anónimo · comunicación vía folio y clave' : 'Identificado · identidad reservada al comité') + '</dd>' +
      '<dt>Resumen</dt><dd>' + esc(d.resumen) + '</dd><dt>Investigador</dt><dd>' + quien(d.investigador) + '</dd></dl></div></div>' +
      '<div class="card"><div class="card__head"><h3>Bitácora del caso</h3></div><div class="card__body"><ul class="timeline" id="bit">' + bitacoraHtml(d) + '</ul></div></div>' +
      '</div><div class="grid">' +
      '<div class="card"><div class="card__head"><h3>Plazos</h3></div><div class="card__body"><dl class="dl" style="grid-template-columns:1fr"><dt>Recepción</dt><dd>' + fecha(d.fecha) + '</dd><dt>Acuse de recibo</dt><dd>' + fecha(new Date(d.fecha.getTime() + 2 * 86400000)) + '</dd><dt>Vence etapa actual</dt><dd>' + (fin ? 'Caso cerrado' : '<b>' + fecha(d.plazo) + '</b> <span class="small ' + (diasHasta(d.plazo) < 0 ? 'down' : 'muted') + '">(' + relativo(d.plazo) + ')</span>') + '</dd></dl></div></div>' +
      '<div class="card"><div class="card__head"><h3>Confidencialidad</h3></div><div class="card__body small" style="line-height:1.6">Acceso restringido al comité de ética y al investigador asignado. Cada consulta a este expediente queda registrada en el log de auditoría.</div></div>' +
      '</div></div>';
    shell('denuncias', html);
    var b = $('#advBtn');
    if (b) b.addEventListener('click', function () {
      d.etapa++; d.bitacora.unshift({ f: D.hoy, p: state.user, t: 'Caso avanzado a etapa: ' + etapas[d.etapa] });
      d.plazo = new Date(D.hoy.getTime() + 15 * 86400000);
      viewDenuncia(id); toast('Caso avanzado a <b>' + esc(etapas[d.etapa]) + '</b>');
    });
  }
  function bitacoraHtml(d) { return d.bitacora.map(function (b, k) { return '<li class="' + (k === 0 ? 'now' : 'done') + '"><b>' + esc(b.t) + '</b><span>' + fecha(b.f) + ' · ' + esc(persona(b.p).nombre) + '</span></li>'; }).join(''); }

  // ---------- Protección de datos ----------
  function viewDatos(q) {
    var tab = q.tab || 'rat';
    var tabs = [['rat', 'Registro de tratamientos'], ['derechos', 'Solicitudes de derechos'], ['obligaciones', 'Obligaciones Ley 21.719'], ['brechas', 'Incidentes y brechas']];
    var body = '';
    if (tab === 'rat') {
      body = '<div class="table-wrap"><table class="t"><thead><tr><th>Código</th><th>Actividad de tratamiento</th><th>Área</th><th>Base de licitud</th><th>Datos sensibles</th><th>Transferencia int.</th><th>Riesgo</th></tr></thead><tbody>' +
        D.rat.map(function (t) { return '<tr class="click" data-go="#/datos/' + t.id + '"><td class="code">' + t.id + '</td><td><b>' + esc(t.actividad) + '</b><div class="small muted">' + esc(t.finalidad) + '</div></td><td>' + esc(t.area) + '</td><td>' + esc(t.base) + '</td><td>' + (t.sensibles ? pill('Sí', 'amber') : pill('No', 'gray')) + '</td><td>' + (t.transferencia ? pill(t.transferencia, 'blue') : '—') + '</td><td>' + pill(t.riesgo, t.riesgo === 'Alto' ? 'red' : t.riesgo === 'Medio' ? 'amber' : 'green') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else if (tab === 'derechos') {
      body = '<div class="toolbar"><span class="small muted grow">Plazo de respuesta configurado según la Ley 21.719: ' + esc(D.plazoDerechos) + '.</span></div><div class="table-wrap"><table class="t"><thead><tr><th>Folio</th><th>Derecho</th><th>Titular</th><th>Recepción</th><th>Vence</th><th>Responsable</th><th>Estado</th></tr></thead><tbody>' +
        D.solicitudes.map(function (s) { var e = estadoSolicitud(s); return '<tr><td class="code">' + s.id + '</td><td><b>' + esc(s.derecho) + '</b><div class="small muted">' + esc(s.canal) + '</div></td><td>' + esc(s.titular) + '</td><td>' + fecha(s.fecha) + '</td><td>' + fecha(s.vence) + '</td><td>' + esc(persona(s.resp).nombre) + '</td><td>' + pill(e.t, e.c) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else if (tab === 'obligaciones') {
      body = '<div class="toolbar"><span class="small muted grow">Matriz de obligaciones con estado de cumplimiento, responsable y evidencia. Las referencias normativas son orientativas y deben validarse con el equipo legal.</span></div><div class="table-wrap"><table class="t"><thead><tr><th>Obligación</th><th>Ámbito</th><th>Referencia</th><th>Responsable</th><th>Estado</th></tr></thead><tbody>' +
        D.obligaciones.map(function (o) { return '<tr><td><b>' + esc(o.titulo) + '</b><div class="small muted">' + esc(o.detalle) + '</div></td><td>' + esc(o.ambito) + '</td><td class="small">' + esc(o.ref) + '</td><td>' + esc(persona(o.resp).nombre) + '</td><td>' + pill(o.estado, o.estado === 'Cumple' ? 'green' : o.estado === 'Parcial' ? 'amber' : 'red') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else {
      body = '<div class="table-wrap"><table class="t"><thead><tr><th>Folio</th><th>Incidente</th><th>Detección</th><th>Titulares afectados</th><th>Evaluación</th><th>Estado</th></tr></thead><tbody>' +
        D.brechas.map(function (b) { return '<tr><td class="code">' + b.id + '</td><td><b>' + esc(b.titulo) + '</b><div class="small muted">' + esc(b.detalle) + '</div></td><td>' + fecha(b.fecha) + '</td><td>' + esc(b.afectados) + '</td><td>' + esc(b.evaluacion) + '</td><td>' + pill(b.estado, b.estado === 'Cerrado' ? 'green' : 'amber') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    var pend = D.solicitudes.filter(function (s) { return s.estado !== 'Respondida'; }).length;
    var html = head('Protección de datos personales', '<a href="#/inicio">Inicio</a> / Ley 21.719', '<button class="btn btn--ghost btn--sm" data-export>' + ic('doc', 15) + ' Exportar RAT</button>') +
      '<div class="grid g-4" style="margin-bottom:16px">' +
      '<a class="card kpi" style="color:inherit" href="#/datos?tab=obligaciones"><span class="kpi__label">Cumplimiento Ley 21.719</span><span class="kpi__value">' + cumplimiento('Protección de datos') + '%</span><span class="kpi__sub">obligaciones evaluadas</span></a>' +
      '<a class="card kpi" style="color:inherit" href="#/datos?tab=rat"><span class="kpi__label">Actividades de tratamiento</span><span class="kpi__value">' + D.rat.length + '</span><span class="kpi__sub">' + D.rat.filter(function (t) { return t.sensibles; }).length + ' con datos sensibles</span></a>' +
      '<a class="card kpi" style="color:inherit" href="#/datos?tab=derechos"><span class="kpi__label">Solicitudes pendientes</span><span class="kpi__value">' + pend + '</span><span class="kpi__sub">de ' + D.solicitudes.length + ' recibidas</span></a>' +
      '<a class="card kpi" style="color:inherit" href="#/datos?tab=brechas"><span class="kpi__label">Incidentes del año</span><span class="kpi__value">' + D.brechas.length + '</span><span class="kpi__sub">' + D.brechas.filter(function (b) { return b.estado !== 'Cerrado'; }).length + ' en gestión</span></a></div>' +
      '<div class="card"><div class="tabs">' + tabs.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (t[0] === tab ? 'is-on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' + body + '</div>';
    shell('datos', html); bindGo(); bindDemoButtons();
    $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { location.hash = '#/datos?tab=' + b.dataset.tab; }); });
  }
  function viewTratamiento(id) {
    var t = D.rat.filter(function (x) { return x.id === id; })[0]; if (!t) return notFound();
    var html = head(esc(t.actividad), '<a href="#/datos">Protección de datos</a> / Registro de tratamientos / ' + t.id, '<button class="btn btn--ghost btn--sm" data-evid="' + t.id + '">' + ic('up', 15) + ' Adjuntar evidencia</button>') +
      '<div class="ficha"><div class="grid"><div class="card"><div class="card__head"><h3>Ficha de la actividad de tratamiento</h3>' + pill('Riesgo ' + t.riesgo, t.riesgo === 'Alto' ? 'red' : t.riesgo === 'Medio' ? 'amber' : 'green') + '</div><div class="card__body"><dl class="dl">' +
      '<dt>Finalidad</dt><dd>' + esc(t.finalidad) + '</dd><dt>Base de licitud</dt><dd>' + esc(t.base) + '</dd><dt>Categorías de titulares</dt><dd>' + esc(t.titulares) + '</dd>' +
      '<dt>Categorías de datos</dt><dd>' + esc(t.datos) + '</dd><dt>Datos sensibles</dt><dd>' + (t.sensibles ? esc(t.sensibles) : 'No') + '</dd>' +
      '<dt>Sistemas</dt><dd>' + esc(t.sistemas) + '</dd><dt>Encargados del tratamiento</dt><dd>' + esc(t.encargados) + '</dd>' +
      '<dt>Transferencia internacional</dt><dd>' + esc(t.transferencia || 'No') + '</dd><dt>Plazo de conservación</dt><dd>' + esc(t.conservacion) + '</dd>' +
      '<dt>Medidas de seguridad</dt><dd>' + esc(t.seguridad) + '</dd><dt>Área responsable</dt><dd>' + esc(t.area) + ' · ' + quien(t.resp) + '</dd></dl></div></div></div>' +
      '<div class="grid"><div class="card"><div class="card__head"><h3>Evaluación de impacto</h3></div><div class="card__body small" style="line-height:1.6">' + esc(t.eipd) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Evidencias</h3></div><div class="card__body" id="evlist">' + filesHtml(t.evidencias) + '</div></div></div></div>';
    shell('datos', html); bindDemoButtons(t.evidencias);
  }

  // ---------- Capacitación ----------
  function viewCapacitacion() {
    var html = head('Capacitación y difusión', '<a href="#/inicio">Inicio</a> / Gestión', '<button class="btn btn--ghost btn--sm" data-new>+ Programar curso</button>') +
      '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Curso</th><th>Público objetivo</th><th>Modalidad</th><th>Fecha límite</th><th>Avance</th></tr></thead><tbody>' +
      D.capacitaciones.map(function (c) { var pct = Math.round(c.aprobados / c.inscritos * 100); return '<tr><td><b>' + esc(c.curso) + '</b><div class="small muted">' + esc(c.norma) + '</div></td><td>' + esc(c.publico) + '</td><td>' + esc(c.modalidad) + '</td><td>' + fecha(c.limite) + '<div class="small muted">' + relativo(c.limite) + '</div></td><td style="min-width:170px"><div class="bars__row" style="grid-template-columns:1fr 70px"><div class="bar"><i style="width:' + pct + '%;background:' + (pct >= 90 ? 'var(--green)' : pct >= 60 ? 'var(--gold)' : 'var(--red)') + '"></i></div><span class="small">' + c.aprobados + '/' + c.inscritos + '</span></div></td></tr>'; }).join('') +
      '</tbody></table></div></div>';
    shell('capacitacion', html); bindDemoButtons();
  }

  // ---------- Documentos ----------
  function viewDocumentos() {
    var html = head('Documentos del sistema de cumplimiento', '<a href="#/inicio">Inicio</a> / Gestión', '') +
      '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Documento</th><th>Tipo</th><th>Versión</th><th>Aprobado por</th><th>Próxima revisión</th><th>Estado</th></tr></thead><tbody>' +
      D.documentos.map(function (d) { var n = diasHasta(d.revision); var st = n < 0 ? ['Revisión vencida', 'red'] : n < 60 ? ['Revisar pronto', 'amber'] : ['Vigente', 'green']; return '<tr class="click" data-doc="' + d.id + '"><td><span style="display:inline-flex;gap:10px;align-items:center"><span class="file__ext ext-pdf" style="width:28px;height:34px">PDF</span><b>' + esc(d.nombre) + '</b></span></td><td>' + esc(d.tipo) + '</td><td>v' + esc(d.version) + '</td><td>' + esc(d.aprobado) + '</td><td>' + fecha(d.revision) + '</td><td>' + pill(st[0], st[1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
    shell('documentos', html);
    $$('[data-doc]').forEach(function (r) { r.addEventListener('click', function () { toast('En la plataforma real se abre el documento con su <b>historial de versiones</b>. Contenido no disponible en la demo.'); }); });
  }

  // ---------- Reportes ----------
  function viewReportes() {
    var html = head('Reportes', '<a href="#/inicio">Inicio</a> / Gestión', '') +
      hint('Genera reportes con un clic a partir de los datos vivos de la plataforma. Prueba el <b>Informe semestral al Directorio</b>.') +
      '<div class="grid g-3">' + D.reportes.map(function (r) {
        return '<div class="card"><div class="card__body"><div class="list__icon" style="background:var(--gold-soft);color:#7d6531;margin-bottom:12px">' + ic(r.icon) + '</div><b style="display:block;margin-bottom:4px">' + esc(r.nombre) + '</b><p class="small muted" style="margin-bottom:14px;line-height:1.5">' + esc(r.desc) + '</p><button class="btn btn--navy btn--sm" data-rep="' + r.id + '">Generar</button></div></div>';
      }).join('') + '</div>';
    shell('reportes', html); bindHint();
    $$('[data-rep]').forEach(function (b) { b.addEventListener('click', function () { generarReporte(b.dataset.rep); }); });
  }
  function generarReporte(id) {
    var r = D.reportes.filter(function (x) { return x.id === id; })[0];
    var altos = D.riesgos.filter(function (x) { return residual(x).score >= D.escala.umbralAlto; });
    var ctrlAt = D.controles.filter(function (c) { return estadoControl(c).c !== 'green'; });
    var planes = D.planes.map(function (p) { return { p: p, a: avancePlan(p) }; });
    var vencidas = D.denuncias.filter(function (x) { return x.etapa < D.etapasDenuncia.length - 1 && diasHasta(x.plazo) < 0; }).length;
    var body = '<div class="report"><div class="report__wm">Documento de demostración · datos ficticios</div><h2>' + esc(r.nombre) + '</h2><div class="small muted">' + esc(D.org.nombre) + ' · emitido el ' + fecha(D.hoy) + ' por ' + esc(persona(state.user).nombre) + '</div>' +
      '<h4>1. Resumen ejecutivo</h4><p>El nivel de cumplimiento global alcanza un <b>' + cumplimiento() + '%</b>. Se mantienen <b>' + altos.length + '</b> riesgo(s) con nivel residual alto o superior y <b>' + ctrlAt.length + '</b> de ' + D.controles.length + ' controles requieren atención. Hay <b>' + denunciasAbiertas() + '</b> denuncias en curso' + (vencidas ? ', de las cuales <b>' + vencidas + '</b> superó el plazo de su etapa' : ', todas dentro de plazo') + '.</p>' +
      '<h4>2. Riesgos residuales prioritarios</h4><table class="t"><tbody>' + altos.map(function (x) { return '<tr><td class="code">' + x.id + '</td><td>' + esc(x.delito) + ' — ' + esc(x.proceso) + '</td><td>' + nivelPill(residual(x).score) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<h4>3. Controles que requieren atención</h4><table class="t"><tbody>' + ctrlAt.map(function (c) { var e = estadoControl(c); return '<tr><td class="code">' + c.id + '</td><td>' + esc(c.titulo) + '</td><td>' + pill(e.t, e.c) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<h4>4. Avance de planes de mantención</h4><table class="t"><tbody>' + planes.map(function (x) { return '<tr><td>' + esc(x.p.nombre) + '</td><td>' + x.a.pct + '% (' + x.a.done + '/' + x.a.total + ')</td><td>' + (x.a.atrasadas ? pill(x.a.atrasadas + ' atrasada(s)', 'red') : pill('Al día', 'green')) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<h4>5. Canal de denuncias</h4><p>Recibidas en el año: <b>' + D.kpiDenuncias.anio + '</b>. Tiempo promedio de cierre: <b>' + D.kpiDenuncias.diasCierre + ' días</b>. Abiertas: <b>' + denunciasAbiertas() + '</b>.</p>' +
      '<h4>6. Protección de datos</h4><p>Cumplimiento de obligaciones Ley 21.719: <b>' + cumplimiento('Protección de datos') + '%</b>. Actividades de tratamiento registradas: <b>' + D.rat.length + '</b>. Solicitudes de derechos pendientes: <b>' + D.solicitudes.filter(function (s) { return s.estado !== 'Respondida'; }).length + '</b>.</p>' +
      '<h4>7. Recomendaciones</h4><ul style="padding-left:18px">' + D.recomendaciones.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    openModal(esc(r.nombre), body, '<button class="btn btn--ghost" data-close>Cerrar</button><button class="btn btn--gold" id="prBtn">' + ic('print', 15) + ' Imprimir / PDF</button>');
    $('#prBtn').addEventListener('click', function () { window.print(); });
  }

  // ---------- Búsqueda ----------
  function viewBuscar(term) {
    var t = (term || '').toLowerCase(), res = [];
    if (t) {
      D.riesgos.forEach(function (r) { if ((r.id + r.delito + r.proceso + r.descripcion).toLowerCase().indexOf(t) >= 0) res.push(['Riesgo', r.id, r.delito + ' — ' + r.proceso, '#/riesgos/' + r.id]); });
      D.controles.forEach(function (c) { if ((c.id + c.titulo + c.detalle).toLowerCase().indexOf(t) >= 0) res.push(['Control', c.id, c.titulo, '#/controles/' + c.id]); });
      D.denuncias.forEach(function (d) { if ((d.id + d.categoria + d.resumen).toLowerCase().indexOf(t) >= 0) res.push(['Denuncia', d.id, d.categoria, '#/denuncias/' + d.id]); });
      D.rat.forEach(function (x) { if ((x.id + x.actividad + x.finalidad).toLowerCase().indexOf(t) >= 0) res.push(['Tratamiento', x.id, x.actividad, '#/datos/' + x.id]); });
    }
    var html = head('Resultados para “' + esc(term) + '”', '<a href="#/inicio">Inicio</a> / Búsqueda', '') +
      '<div class="card"><div class="table-wrap"><table class="t"><tbody>' + (res.length ? res.map(function (x) { return '<tr class="click" data-go="' + x[3] + '"><td>' + pill(x[0], 'navy') + '</td><td class="code">' + esc(x[1]) + '</td><td>' + esc(x[2]) + '</td></tr>'; }).join('') : '<tr><td class="empty">Sin resultados. Prueba con “cohecho”, “proveedores”, “clientes” o “DEN”.</td></tr>') + '</tbody></table></div></div>';
    shell('', html); bindGo(); $('#q').value = term;
  }
  function notFound() { shell('', head('No encontrado', '<a href="#/inicio">Inicio</a>', '') + '<div class="card empty">El registro no existe en la demo.</div>'); }

  // ---------- Modal ----------
  function openModal(title, body, foot) {
    modal.innerHTML = '<div class="modal__head"><h3>' + title + '</h3><button class="icon-btn" data-close aria-label="Cerrar">' + ic('x') + '</button></div><div class="modal__body">' + body + '</div>' + (foot ? '<div class="modal__foot">' + foot + '</div>' : '');
    modal.classList.add('is-on'); overlay.classList.add('is-on');
    $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeModal); });
  }
  function closeModal() { modal.classList.remove('is-on'); overlay.classList.remove('is-on'); }
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  // ---------- Router ----------
  function parse() {
    var h = location.hash.replace(/^#\/?/, ''), qi = h.indexOf('?'), q = {};
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    return { parts: h.split('/').filter(Boolean), q: q };
  }
  function render() {
    closeModal();
    if (!state.user) { var s = store('rt-demo-user'); if (s && D.personas[s]) state.user = s; }
    var r = parse(), p = r.parts;
    if (!state.user || p[0] === 'login' || !p.length) { if (state.user && p[0] !== 'login') { location.replace('#/inicio'); return; } if (!state.user) return renderLogin(); }
    document.title = 'Demo RegulaTec — ' + D.org.nombre;
    switch (p[0]) {
      case 'inicio': return viewInicio();
      case 'alertas': return viewAlertas(r.q);
      case 'riesgos': return p[1] ? viewRiesgo(p[1]) : viewRiesgos(r.q);
      case 'controles': return p[1] ? viewControl(p[1]) : viewControles(r.q);
      case 'planes': return p[1] ? viewPlan(p[1], r.q) : viewPlanes();
      case 'denuncias': return p[1] ? viewDenuncia(p[1]) : viewDenuncias();
      case 'datos': return p[1] ? viewTratamiento(p[1]) : viewDatos(r.q);
      case 'capacitacion': return viewCapacitacion();
      case 'documentos': return viewDocumentos();
      case 'reportes': return viewReportes();
      case 'buscar': return viewBuscar(p.slice(1).join('/'));
      case 'login': return renderLogin();
      default: return viewInicio();
    }
  }
  window.addEventListener('hashchange', render);
  render();
})();
