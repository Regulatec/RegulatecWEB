/* ============================================================
   Sitio comercial — Plataforma de Gestión de Consentimientos
   W-IT + RegulaTec
   ============================================================ */
(function () {
  "use strict";

  /* Menú móvil */
  var toggle = document.getElementById("navToggle");
  var links = document.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", function () { links.classList.toggle("open"); });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  /* Resalta la sección visible en el menú */
  var navLinks = [].slice.call(document.querySelectorAll(".nav__links a"));
  var sections = [].slice.call(document.querySelectorAll("section[id]"));
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* Acordeón: abrir una pregunta cierra las demás */
  var items = [].slice.call(document.querySelectorAll(".faq__item"));
  items.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      items.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();
