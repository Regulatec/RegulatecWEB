/* ============================================================
   Interactividad — Sitio Arquitectura CMP · W-IT
   ============================================================ */
(function () {
  "use strict";

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
    set("detailBadge", c.badge);
    set("detailName", c.name);
    set("detailTech", c.tech);
    set("detailFn", c.fn);
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

  /* ---------- Conectores SVG del diagrama ---------- */
  const diagram = document.getElementById("diagram");
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
    // scroll current fnode into view within its container
    const cur = fDiagram.querySelector(".fnode.is-current");
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
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
