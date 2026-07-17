/* ============================================================
   Interactividad — Sitio Arquitectura CMP · W-IT
   ============================================================ */
(function () {
  "use strict";

  // Overrides de nombre/tech por opción activa (p. ej. componentes sobre GCP/Oracle en la opción híbrida)
  let activeOverrides = {};

  /* ---------- NAV móvil ---------- */
  const toggle = document.getElementById("navToggle");
  const links = document.querySelector(".nav__links");
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") links.classList.remove("open");
  });

  /* ---------- Scroll-spy ---------- */
  const sections = [...document.querySelectorAll("section[id]")];
  const navA = [...document.querySelectorAll(".nav__links a")];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const id = en.target.id;
        navA.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------- Panel de detalle de componentes ---------- */
  const detail = document.getElementById("detail");
  const dClose = document.getElementById("detailClose");
  const set = (id, v) => (document.getElementById(id).textContent = v);

  function openDetail(id) {
    const c = COMPONENTS[id];
    if (!c) return;
    const ov = activeOverrides[id] || {};
    set("detailBadge", c.badge);
    set("detailName", ov.name || c.name);
    set("detailTech", ov.tech || c.tech);
    set("detailFn", ov.fn || c.fn);
    set("detailResp", c.resp);
    set("detailRefs", c.refs);
    detail.classList.add("is-open");
    detail.setAttribute("aria-hidden", "false");
  }
  function closeDetail() {
    detail.classList.remove("is-open");
    detail.setAttribute("aria-hidden", "true");
  }
  dClose.addEventListener("click", closeDetail);
  detail.addEventListener("click", (e) => { if (e.target === detail) closeDetail(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });

  const nodes = [...document.querySelectorAll(".node")];
  nodes.forEach((n) => {
    const id = n.dataset.id;
    n.addEventListener("click", () => openDetail(id));
    n.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(id); }
    });
  });

  /* ---------- Íconos por tipo de componente ---------- */
  const ICONS = {
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3"/><path d="M16 7l3 3"/><path d="M18.5 4.5 21 7"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    chart: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
    bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    queue: '<rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/>',
    braces: '<path d="M8 4c-2 0-2.5 1.5-2.5 3.5S5 11 3.5 11c1.5 0 2 1 2 3.5S6 18 8 18"/><path d="M16 4c2 0 2.5 1.5 2.5 3.5S19 11 20.5 11c-1.5 0-2 1-2 3.5S18 18 16 18"/>',
    layers: '<path d="M12 2 2 7l10 5 10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
    sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    cog: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3.5M12 18.5V22M4.2 4.2l2.5 2.5M17.3 17.3l2.5 2.5M2 12h3.5M18.5 12H22M4.2 19.8l2.5-2.5M17.3 6.7l2.5-2.5"/>',
    activity: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M9.5 12h5"/>',
    hub: '<circle cx="12" cy="12" r="2.5"/><circle cx="4" cy="5" r="2"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="20" cy="19" r="2"/><path d="m6 6 4 4M6 18l4-4M18 6l-4 4M18 18l-4-4"/>',
    devices: '<rect x="2" y="4" width="13" height="10" rx="1"/><path d="M2 18h13"/><rect x="17" y="8" width="5" height="12" rx="1"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="1"/><rect x="3" y="13" width="18" height="7" rx="1"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    link: '<path d="M9 15 15 9"/><path d="M8.5 8.5 7 10a4 4 0 0 0 5.7 5.6l1.3-1.3"/><path d="M15.5 15.5 17 14a4 4 0 0 0-5.7-5.6L10 9.7"/>',
    envelope: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6.4"/><path d="M18 20c0-2.4-.9-4.3-2.3-5.4"/>',
    bank: '<path d="M3 21h18"/><path d="M5 21V9.5M9 21V9.5M15 21V9.5M19 21V9.5"/><path d="M12 3 3.5 8.5h17z"/>',
    wrench: '<path d="M15 6.5a3.6 3.6 0 0 0-4.8 4.5L3 18.2 5.8 21l7.2-7.2a3.6 3.6 0 0 0 4.5-4.8l-2.4 2.4-2.1-2.1z"/>'
  };
  const NODE_ICON = {
    A1: "layers", A2: "database", A3: "sliders", A4: "cog", A5: "chart", A6: "shield",
    B1: "braces", B2: "queue", B3: "bolt", B4: "database", B5: "archive", B6: "activity", B7: "key",
    C1: "hub", C2: "devices", C3: "server", C4: "link", C5: "envelope",
    TIT: "users", CMF: "bank", WIT: "wrench"
  };
  nodes.forEach((n) => {
    const ic = NODE_ICON[n.dataset.id];
    if (!ic || !ICONS[ic]) return;
    const span = document.createElement("span");
    span.className = "node__icon";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[ic]}</svg>`;
    n.appendChild(span);
  });

  /* ---------- Alternativas de despliegue (Opción 1/2/3) ---------- */
  const diagram = document.getElementById("diagram");
  const tAra = document.getElementById("tenantAraucana");
  const tWit = document.getElementById("tenantWit");
  const tGcp = document.getElementById("tenantGcp");
  const xcloud = document.getElementById("xcloud");
  const xcloudBadge = xcloud.querySelector(".xcloud__badge");
  const laneA = document.getElementById("laneA");
  const laneB = document.getElementById("laneB");
  const laneG = document.getElementById("laneG");
  const witNode = document.querySelector(".node--wit");
  const witName = witNode.querySelector(".node__name");
  const witTech = witNode.querySelector(".node__tech");
  const caption = document.getElementById("diagramCaption");
  const bNode = (id) => document.querySelector('.node[data-id="' + id + '"]');
  const B_ORDER = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"];
  const dataNote = document.getElementById("dataNote");
  const dataNoteTxt = document.getElementById("dataNoteTxt");

  // Captura nombre/tech originales de los nodos que se relabelan por opción
  const NODE_DEFAULTS = {};
  ["B4", "B5", "B6"].forEach((id) => {
    const n = bNode(id);
    NODE_DEFAULTS[id] = {
      name: n.querySelector(".node__name").textContent,
      tech: n.querySelector(".node__tech").textContent
    };
  });

  const OPTIONS = {
    "1": {
      caption: "Alternativa base (recomendada). Todo el CMP —Power Platform y la capa Azure— vive en el tenant y la suscripción de La Araucana. Los datos, las evidencias y el licenciamiento quedan bajo dominio de la Caja; W-IT opera el servicio con accesos JIT auditados, sin custodiar datos personales.",
      araucana: ["laneB", "laneA"], wit: null, gcp: false, xcloud: false,
      gcpNodes: [], azureLabel: "Suscripción Azure de La Araucana", xcloudText: "",
      dataNote: "", nodeOverrides: null,
      witNode: { name: "Servicio administrado", tech: "soporte JIT auditado · sin custodia" }
    },
    "2": {
      caption: "W-IT SaaS (capa Azure). El registro Dataverse y todo el backoffice (Power Platform) permanecen siempre en el tenant de La Araucana; solo la capa Azure —integración, procesamiento y evidencias— se provee y opera desde el tenant y la suscripción de W-IT, que la Caja consume vía API. Ambas nubes se unen por conexión privada cifrada. W-IT actúa como encargado de tratamiento de esa capa (Ley 21.719).",
      araucana: ["laneA"], wit: ["laneB"], gcp: false, xcloud: true,
      gcpNodes: [], azureLabel: "Suscripción Azure de W-IT",
      xcloudText: "🔒 Conexión privada entre nubes · VPN / peering cifrado (IPsec · TLS 1.3) · Microsoft ↔ W-IT",
      nodeOverrides: null,
      dataNote: "En esta modalidad el dato personal transita y reposa en pasarelas y servicios operados por W-IT. Por ello W-IT actúa como encargado de tratamiento (Ley 21.719): debe suscribirse un contrato de encargo de tratamiento y aplicarse salvaguardas —cifrado en tránsito y en reposo, control de accesos y subencargados documentados—. Si algún servicio reside fuera de Chile, aplica además el régimen de transferencia internacional de datos. Alcance y cláusulas a validar por la Fiscalía de La Araucana con el apoyo de RegulaTec.",
      witNode: { name: "Opera la capa Azure (SaaS)", tech: "encargado de tratamiento · evidencias en W-IT" }
    },
    "3": {
      caption: "Modelo híbrido, todo en el dominio de La Araucana. El Power Platform y la capa Azure principal (API, colas, procesamiento y secretos) permanecen en su tenant Microsoft; algunos componentes —read store, repositorio de evidencias y monitoreo— se despliegan sobre las propias plataformas GCP / Oracle de la Caja, con servicios equivalentes, donde ella tiene capacidad de administración. Integración privada y cifrada dentro del dominio de la Caja; W-IT no custodia datos.",
      araucana: ["laneB", "laneA"], wit: null, gcp: true, xcloud: true,
      gcpNodes: ["B4", "B5", "B6"], azureLabel: "Suscripción Azure de La Araucana",
      xcloudText: "🔒 Integración privada en el dominio de La Araucana · Azure ↔ GCP / Oracle (cifrada)",
      nodeOverrides: {
        B4: { name: "Read store (CQRS)", tech: "GCP / Oracle · consulta en línea", fn: "Mismo patrón CQRS de consulta en línea, desplegado sobre las plataformas propias de La Araucana (p. ej. base de datos gestionada en GCP u Oracle) en lugar de Azure. Proyección del estado vigente por RUT / finalidad; baja latencia; sirve además el texto legal vigente y versionado." },
        B5: { name: "Almacenamiento WORM", tech: "GCP / Oracle · evidencias REDEC 5 años", fn: "Repositorio de evidencias REDEC (PDF/MP3) con inmutabilidad y retención de 5 años, sobre almacenamiento de objetos de La Araucana (p. ej. GCP Cloud Storage con bloqueo/retención u Oracle Object Storage), en reemplazo de Azure Blob WORM." },
        B6: { name: "Monitoreo / Observabilidad", tech: "GCP / Oracle · métricas y alertas", fn: "Monitoreo, alertas y dashboards sobre las herramientas propias de La Araucana (p. ej. Google Cloud Operations u Oracle Observability), en reemplazo de Azure Monitor." }
      },
      dataNote: "Aunque el dato reside en el dominio de La Araucana (Microsoft y sus plataformas GCP / Oracle), si transita por pasarelas o servicios operados por W-IT debe evaluarse su responsabilidad sobre el dato en tránsito y formalizarse el acuerdo o encargo correspondiente (Ley 21.719), con cifrado en tránsito y en reposo. Alcance y cláusulas a validar por la Fiscalía de La Araucana con el apoyo de RegulaTec.",
      witNode: { name: "Servicio administrado", tech: "soporte JIT auditado · sin custodia" }
    }
  };
  const laneEls = { laneA: laneA, laneB: laneB };

  function applyOption(opt) {
    const cfg = OPTIONS[opt] || OPTIONS["1"];
    diagram.dataset.opt = opt;
    caption.textContent = cfg.caption;
    laneB.dataset.lane = cfg.azureLabel;
    witName.textContent = cfg.witNode.name;
    witTech.textContent = cfg.witNode.tech;

    // Reparte los nodos B entre la capa Azure (laneB) y GCP/Oracle (laneG), en orden canónico
    B_ORDER.forEach((id) => {
      const n = bNode(id);
      if (cfg.gcpNodes.indexOf(id) !== -1) laneG.appendChild(n);
      else laneB.appendChild(n);
    });

    // Relabel de nodos: restaura por defecto y aplica overrides de la opción (p. ej. GCP/Oracle)
    activeOverrides = cfg.nodeOverrides || {};
    Object.keys(NODE_DEFAULTS).forEach((id) => {
      const n = bNode(id);
      const ov = activeOverrides[id];
      n.querySelector(".node__name").textContent = ov ? ov.name : NODE_DEFAULTS[id].name;
      n.querySelector(".node__tech").textContent = ov ? ov.tech : NODE_DEFAULTS[id].tech;
    });

    // Aviso de responsabilidad sobre el dato (opciones con pasarelas W-IT)
    if (cfg.dataNote) {
      dataNoteTxt.textContent = cfg.dataNote;
      dataNote.classList.remove("is-off");
      dataNote.setAttribute("aria-hidden", "false");
    } else {
      dataNote.classList.add("is-off");
      dataNote.setAttribute("aria-hidden", "true");
    }

    // Tenant La Araucana
    if (cfg.araucana) {
      tAra.classList.remove("is-off");
      tAra.setAttribute("aria-hidden", "false");
      cfg.araucana.forEach((id) => tAra.appendChild(laneEls[id]));
    } else {
      tAra.classList.add("is-off");
      tAra.setAttribute("aria-hidden", "true");
    }
    // Tenant W-IT
    if (cfg.wit) {
      tWit.classList.remove("is-off");
      tWit.setAttribute("aria-hidden", "false");
      cfg.wit.forEach((id) => tWit.appendChild(laneEls[id]));
    } else {
      tWit.classList.add("is-off");
      tWit.setAttribute("aria-hidden", "true");
    }
    // Dominio GCP / Oracle de La Araucana
    tGcp.classList.toggle("is-off", !cfg.gcp);
    tGcp.setAttribute("aria-hidden", cfg.gcp ? "false" : "true");

    // Conector (entre nubes o interno de La Araucana)
    xcloud.classList.toggle("is-off", !cfg.xcloud);
    xcloud.setAttribute("aria-hidden", cfg.xcloud ? "false" : "true");
    if (cfg.xcloud) xcloudBadge.textContent = cfg.xcloudText;

    // botones
    [...document.querySelectorAll(".dopt")].forEach((b) =>
      b.classList.toggle("is-active", b.dataset.opt === opt)
    );
    drawEdges();
  }

  document.querySelectorAll(".dopt").forEach((b) => {
    b.addEventListener("click", () => applyOption(b.dataset.opt));
  });
  const svg = document.getElementById("edges");
  const nodeMap = {};
  nodes.forEach((n) => (nodeMap[n.dataset.id] = n));

  function center(el) {
    const d = diagram.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - d.left + r.width / 2, y: r.top - d.top + r.height / 2 };
  }

  function drawEdges() {
    if (window.innerWidth <= 900) { svg.innerHTML = ""; return; }
    svg.innerHTML = "";
    EDGES.forEach(([a, b]) => {
      const na = nodeMap[a], nb = nodeMap[b];
      if (!na || !nb) return;
      const p1 = center(na), p2 = center(nb);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const mx = (p1.x + p2.x) / 2;
      path.setAttribute("d", `M ${p1.x} ${p1.y} C ${mx} ${p1.y}, ${mx} ${p2.y}, ${p2.x} ${p2.y}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#c9d6d3");
      path.setAttribute("stroke-width", "1.5");
      path.dataset.a = a; path.dataset.b = b;
      svg.appendChild(path);
    });
  }
  const rerender = () => requestAnimationFrame(drawEdges);
  window.addEventListener("resize", rerender);
  window.addEventListener("load", drawEdges);
  drawEdges();
  applyOption("1");

  /* ---------- Reproductor de flujos ---------- */
  const tabsEl = document.getElementById("flowTabs");
  const fDiagram = document.getElementById("flowDiagram");
  const fTitle = document.getElementById("flowTitle");
  const fDesc = document.getElementById("flowDesc");
  const fSteps = document.getElementById("flowSteps");
  const btnPrev = document.getElementById("flowPrev");
  const btnNext = document.getElementById("flowNext");
  const btnPlay = document.getElementById("flowPlay");

  let curFlow = 0, curStep = 0, timer = null;

  // Construir tabs
  FLOWS.forEach((f, i) => {
    const b = document.createElement("button");
    b.className = "flow__tab" + (i === 0 ? " active" : "");
    b.textContent = f.id;
    b.title = f.name;
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => { stopPlay(); selectFlow(i); });
    tabsEl.appendChild(b);
  });

  function renderFlowDiagram(flow) {
    fDiagram.innerHTML = "";
    flow.steps.forEach((s, i) => {
      const c = COMPONENTS[s.node];
      const el = document.createElement("div");
      el.className = "fnode";
      el.dataset.step = i;
      el.innerHTML = `<span class="fnode__tag">${c.badge}</span><span class="fnode__name">${c.name}</span>`;
      fDiagram.appendChild(el);
      if (i < flow.steps.length - 1) {
        const ar = document.createElement("span");
        ar.className = "fnode__arrow";
        ar.textContent = "→";
        fDiagram.appendChild(ar);
      }
    });
  }

  function renderSteps(flow) {
    fSteps.innerHTML = "";
    flow.steps.forEach((s, i) => {
      const li = document.createElement("li");
      li.dataset.step = i;
      li.textContent = s.text;
      fSteps.appendChild(li);
    });
  }

  function selectFlow(i) {
    curFlow = i; curStep = 0;
    const flow = FLOWS[i];
    [...tabsEl.children].forEach((t, k) => t.classList.toggle("active", k === i));
    fTitle.textContent = flow.name;
    fDesc.textContent = flow.desc;
    renderFlowDiagram(flow);
    renderSteps(flow);
    paintStep();
  }

  function paintStep() {
    const flow = FLOWS[curFlow];
    // flow diagram nodes
    [...fDiagram.querySelectorAll(".fnode")].forEach((el) => {
      const s = +el.dataset.step;
      el.classList.toggle("is-on", s < curStep);
      el.classList.toggle("is-current", s === curStep);
    });
    // step list
    [...fSteps.children].forEach((li) => {
      li.classList.toggle("is-active", +li.dataset.step === curStep);
    });
  }

  function next() {
    const flow = FLOWS[curFlow];
    if (curStep < flow.steps.length - 1) { curStep++; paintStep(); return true; }
    return false;
  }
  function prev() {
    if (curStep > 0) { curStep--; paintStep(); }
  }

  btnNext.addEventListener("click", () => { stopPlay(); next(); });
  btnPrev.addEventListener("click", () => { stopPlay(); prev(); });

  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; btnPlay.textContent = "▶ Reproducir"; }
  }
  function startPlay() {
    curStep = 0; paintStep();
    btnPlay.textContent = "⏸ Pausar";
    timer = setInterval(() => { if (!next()) stopPlay(); }, 1400);
  }
  btnPlay.addEventListener("click", () => {
    if (timer) stopPlay(); else startPlay();
  });

  selectFlow(0);
})();
