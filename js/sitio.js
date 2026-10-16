/*
 * RegulaTec by W-IT — comportamiento del menú global (móvil y submenús por teclado/toque).
 */
(function () {
  var nav = document.querySelector('nav.rt-nav');
  if (!nav) return;
  var burger = nav.querySelector('.rt-burger');

  if (burger) {
    burger.addEventListener('click', function () {
      var abierto = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
  }

  nav.querySelectorAll('.rt-menu > li > button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var li = btn.parentElement;
      var abierto = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      nav.querySelectorAll('.rt-menu > li.is-open').forEach(function (otro) {
        if (otro !== li) { otro.classList.remove('is-open'); otro.querySelector('button').setAttribute('aria-expanded', 'false'); }
      });
    });
  });

  // Cerrar al elegir un enlace (anclas de la misma página) o al presionar Escape / clic fuera.
  nav.querySelectorAll('.rt-menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      nav.querySelectorAll('.rt-menu > li.is-open').forEach(function (li) { li.classList.remove('is-open'); });
      if (burger) burger.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    nav.classList.remove('is-open');
    nav.querySelectorAll('.rt-menu > li.is-open').forEach(function (li) { li.classList.remove('is-open'); });
  });
  document.addEventListener('click', function (e) {
    if (nav.contains(e.target)) return;
    nav.querySelectorAll('.rt-menu > li.is-open').forEach(function (li) { li.classList.remove('is-open'); });
  });

  // "Gestionar cookies" del footer: reabre el banner (si la página lo tiene) o lleva a la política.
  document.querySelectorAll('[data-cookies-config]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var banner = document.getElementById('cookie-banner');
      if (!banner) { location.href = '/politica-cookies.html'; return; }
      try { localStorage.removeItem('cookieConsent'); } catch (x) {}
      banner.classList.add('visible');
    });
  });

  // En páginas internas el enlace de la demo lleva a la home, donde se abre el popup.
  if (!document.getElementById('demoModal')) {
    nav.querySelectorAll('[data-demo-open]').forEach(function (a) { a.setAttribute('href', '/#demo'); });
  }
})();
