"""
Aplica el menu y el footer globales de RegulaTec by W-IT a las paginas del sitio.

Uso (desde la raiz del repo):  python tools/aplicar_menu.py

- Reemplaza el bloque <nav ...>...</nav> y <footer ...>...</footer> de cada pagina listada
  por la version unica definida aqui (NAV / FOOTER).
- Agrega /css/sitio.css y /js/sitio.js si la pagina aun no los referencia.
- Es idempotente: se puede ejecutar cada vez que cambie el menu.
"""
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent

PAGINAS = [
    "index.html",
    "assessment-tecnolegal.html", "cco-as-a-service-chile.html", "compliance-360-microsoft.html",
    "compliance-normativo-chile.html", "diagnostico-ley-21719.html", "dpo-as-a-service-chile.html",
    "iso-37001-37301-chile.html", "ley-20393-chile.html", "ley-21719-chile.html",
    "modelo-prevencion-delitos-chile.html", "multas-ley-21719-chile.html",
    "plataforma-proteccion-datos-chile.html", "sistema-cumplimiento-empresas.html",
    "software-compliance-chile.html", "aviso-legal.html", "politica-cookies.html",
    "politica-privacidad.html", "gracias.html", "revocar-consentimiento.html",
]

LOGO = "https://witpublicimages.blob.core.windows.net/public/FOTOSREGULATEC/regulatecLogo.png"

NAV = f"""<nav class="rt-nav" aria-label="Menú principal">
  <a href="/" class="nav-brand">
    <img src="{LOGO}" alt="RegulaTec by W-IT" />
    <span class="nav-tagline">Gestión de riesgos legales y regulatorios</span>
  </a>
  <ul class="rt-menu">
    <li>
      <button type="button" aria-expanded="false" aria-haspopup="true">Soluciones<svg viewBox="0 0 10 10"><path d="M1 3l4 4 4-4"/></svg></button>
      <ul class="rt-sub">
        <li class="rt-sub-label">Frentes regulatorios</li>
        <li><a href="/ley-21719-chile.html">Protección de datos personales<small>Ley 21.719</small></a></li>
        <li><a href="/modelo-prevencion-delitos-chile.html">Prevención de delitos<small>Ley 20.393 · Modelo de Prevención de Delitos</small></a></li>
        <li><a href="/#frentes">Prevención LA/FT<small>Debida diligencia, listas y monitoreo</small></a></li>
        <li><a href="/iso-37001-37301-chile.html">Antisoborno y sistemas de compliance<small>ISO 37001 · ISO 37301</small></a></li>
        <li><a href="/compliance-normativo-chile.html">Compliance normativo y GRC<small>Obligaciones, riesgos y controles</small></a></li>
        <li><hr /></li>
        <li class="rt-sub-label">Servicios continuos</li>
        <li><a href="/dpo-as-a-service-chile.html">DPO as a Service</a></li>
        <li><a href="/cco-as-a-service-chile.html">Compliance Officer as a Service</a></li>
      </ul>
    </li>
    <li><a href="/#plataforma">Plataforma</a></li>
    <li><a href="/demo/" class="rt-demo-link" data-demo-open>Explora la plataforma</a></li>
    <li><a href="/#como-trabajamos">Cómo trabajamos</a></li>
    <li>
      <button type="button" aria-expanded="false" aria-haspopup="true">Recursos<svg viewBox="0 0 10 10"><path d="M1 3l4 4 4-4"/></svg></button>
      <ul class="rt-sub">
        <li><a href="/ley-21719-chile.html">Ley 21.719: qué exige y cómo implementarla</a></li>
        <li><a href="/ley-20393-chile.html">Ley 20.393: responsabilidad penal de las personas jurídicas</a></li>
        <li><a href="/compliance-normativo-chile.html">Compliance normativo en Chile</a></li>
        <li><a href="/sistema-cumplimiento-empresas.html">Sistema de cumplimiento para empresas</a></li>
        <li><a href="/compliance-360-microsoft.html">Compliance sobre Microsoft 365 y Power Platform</a></li>
        <li><a href="/#faq">Preguntas frecuentes</a></li>
      </ul>
    </li>
    <li><a href="/#empresa">Empresa</a></li>
    <li class="rt-menu-cta"><a href="/#diagnostico">Solicitar diagnóstico sin costo</a></li>
  </ul>
  <a href="/#diagnostico" class="rt-cta"><span class="rt-cta-long">Solicitar diagnóstico sin costo</span><span class="rt-cta-short">Diagnóstico sin costo</span><svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 7h10M8 3l4 4-4 4"/></svg></a>
  <button type="button" class="rt-burger" aria-label="Abrir menú" aria-expanded="false"><span></span></button>
</nav>"""

FOOTER = f"""<footer class="rt-footer">
  <div class="rt-footer-grid">
    <div class="rt-footer-brand">
      <img src="{LOGO}" alt="RegulaTec by W-IT" />
      <p>Gestión de riesgos legales y regulatorios: convertimos obligaciones en controles, responsables y evidencia que se puede demostrar.</p>
    </div>
    <div>
      <h4>Soluciones</h4>
      <ul>
        <li><a href="/ley-21719-chile.html">Protección de datos personales</a></li>
        <li><a href="/modelo-prevencion-delitos-chile.html">Prevención de delitos</a></li>
        <li><a href="/iso-37001-37301-chile.html">ISO 37001 · ISO 37301</a></li>
        <li><a href="/compliance-normativo-chile.html">Compliance normativo y GRC</a></li>
        <li><a href="/dpo-as-a-service-chile.html">DPO as a Service</a></li>
        <li><a href="/cco-as-a-service-chile.html">Compliance Officer as a Service</a></li>
      </ul>
    </div>
    <div>
      <h4>RegulaTec</h4>
      <ul>
        <li><a href="/#plataforma">Plataforma</a></li>
        <li><a href="/#demo">Explora la plataforma</a></li>
        <li><a href="/#como-trabajamos">Cómo trabajamos</a></li>
        <li><a href="/#empresa">Empresa</a></li>
        <li><a href="/#faq">Preguntas frecuentes</a></li>
        <li><a href="/#diagnostico">Solicitar diagnóstico</a></li>
      </ul>
    </div>
    <div>
      <h4>Contacto y legal</h4>
      <ul>
        <li><a href="mailto:ventas@regulatec.cl">ventas@regulatec.cl</a></li>
        <li><a href="tel:+56934530393">+56 9 3453 0393</a></li>
        <li><a href="/politica-privacidad.html">Política de privacidad</a></li>
        <li><a href="/politica-cookies.html">Política de cookies</a></li>
        <li><a href="/aviso-legal.html">Aviso legal</a></li>
        <li><a href="#" data-cookies-config>Gestionar cookies</a></li>
      </ul>
    </div>
  </div>
  <div class="rt-footer-legal">
    <span>© 2026 RegulaTec by W-IT. RegulaTec by W-IT es una marca operada por W-IT Products SpA.</span>
    <span>Santiago, Chile</span>
  </div>
</footer>"""

RE_NAV = re.compile(r"<nav\b[^>]*>.*?</nav>", re.S)
RE_FOOTER = re.compile(r"<footer\b[^>]*>.*?</footer>", re.S)


def aplicar(ruta: pathlib.Path) -> str:
    html = ruta.read_text(encoding="utf-8")
    original = html
    html, n_nav = RE_NAV.subn(lambda m: NAV, html, count=1)
    html, n_foot = RE_FOOTER.subn(lambda m: FOOTER, html, count=1)
    if n_nav == 0:
        html = re.sub(r"(<body\b[^>]*>)", lambda m: m.group(1) + "\n" + NAV, html, count=1)
    if n_foot == 0:
        html = html.replace("</body>", FOOTER + "\n</body>", 1)
    if "/css/sitio.css" not in html:
        html = html.replace("</head>", '  <link rel="stylesheet" href="/css/sitio.css" />\n</head>', 1)
    if "/js/sitio.js" not in html:
        html = html.replace("</body>", '<script src="/js/sitio.js" defer></script>\n</body>', 1)
    if html != original:
        ruta.write_text(html, encoding="utf-8", newline="")
        return "actualizada"
    return "sin cambios"


if __name__ == "__main__":
    for nombre in PAGINAS:
        ruta = RAIZ / nombre
        print(f"{nombre}: {aplicar(ruta) if ruta.exists() else 'NO EXISTE'}")
