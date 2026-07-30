"""
Plataforma de Gestión de Consentimientos — Flask backend para Azure App Service
Recibe el formulario "Solicitar demo" y:
  1) crea una Oportunidad en el Centro de Ventas de Dynamics 365
     (ambiente comercial real de W-IT: w-it.crm2.dynamics.com)
  2) envía un correo de notificación vía Microsoft Graph (mismo App Registration)

Patrón basado en la guía de integración validada en el proyecto SIGALU
(App Service Linux + gunicorn, no Azure Functions Flex Consumption — ver
GUIA-BASE-SIGALU.md en esta misma carpeta para el detalle de las trampas ya
resueltas: comando de inicio, URLs OData con espacios, CORS, variables de
entorno leídas en tiempo de petición, etc.)

La creación de la Oportunidad es intencionalmente parcial: solo escribe
campos estándar sin riesgo (name, description). Ver el comentario sobre
create_opportunity() y README.md para los campos personalizados obligatorios
del ambiente que todavía faltan por confirmar.
"""
import os, json, logging, urllib.request, urllib.parse, urllib.error
from flask import Flask, request, jsonify

logging.basicConfig(level=logging.INFO)
app = Flask(__name__)


def get_config():
    """Lee credenciales en tiempo de petición, no al iniciar el proceso."""
    return {
        "tenant":           os.environ.get("D365_TENANT_ID", ""),
        "client":           os.environ.get("D365_CLIENT_ID", ""),
        "secret":           os.environ.get("D365_CLIENT_SECRET", ""),
        "url":              os.environ.get("D365_URL", "").rstrip("/"),
        "origins":          os.environ.get("ALLOWED_ORIGINS", "https://www.regulatec.cl"),
        "recaptcha_secret": os.environ.get("RECAPTCHA_SECRET", ""),
        "mail_from":        os.environ.get("MAIL_FROM", ""),   # mailbox que envía (debe existir y tener licencia)
        "mail_to":          os.environ.get("MAIL_TO", "ventas@regulatec.cl"),
    }


# ---------------------------------------------------------------------------
# reCAPTCHA — opcional: si no hay secret configurado, se omite la validación
# (útil mientras se termina de configurar; una vez cargado el secret en
# Azure, la validación pasa a ser obligatoria).
# ---------------------------------------------------------------------------
def verify_recaptcha(secret, token):
    if not secret:
        logging.warning("RECAPTCHA_SECRET no configurado: se omite la validación")
        return True
    if not token:
        logging.warning("Token captcha vacío")
        return False
    body = urllib.parse.urlencode({"secret": secret, "response": token}).encode()
    req = urllib.request.Request(
        "https://www.google.com/recaptcha/api/siteverify", data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req) as r:
        result = json.loads(r.read())
        logging.info(f"reCAPTCHA result: {result}")
        return result.get("success", False)


# ---------------------------------------------------------------------------
# OAuth2 client credentials — un token por scope (Dynamics y Graph son
# recursos distintos, cada uno requiere su propio token aunque venga del
# mismo App Registration).
# ---------------------------------------------------------------------------
def get_token(cfg, scope):
    url = f"https://login.microsoftonline.com/{cfg['tenant']}/oauth2/v2.0/token"
    body = urllib.parse.urlencode({
        "grant_type":    "client_credentials",
        "client_id":     cfg["client"],
        "client_secret": cfg["secret"],
        "scope":         scope,
    }).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]


def http_call(base_url, token, method, path, payload=None, extra_headers=None):
    """Llamada genérica autenticada. Codifica el path preservando los
    caracteres especiales de OData ($ & = etc.) — ver trampa de espacios
    sin codificar en GUIA-INTEGRACION-DYNAMICS.md, sección 5c."""
    safe_path = urllib.parse.quote(path, safe="=&$?/@(),'")
    url = f"{base_url}/{safe_path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    req.add_header("Accept", "application/json")
    for k, v in (extra_headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise Exception(f"{method} {path} -> {e.code}: {body}")


def d365(cfg, token, method, path, payload=None):
    return http_call(
        f"{cfg['url']}/api/data/v9.2", token, method, path, payload,
        extra_headers={"OData-MaxVersion": "4.0", "OData-Version": "4.0", "Prefer": "return=representation"})


def graph(token, method, path, payload=None):
    return http_call("https://graph.microsoft.com/v1.0", token, method, path, payload)


# ---------------------------------------------------------------------------
# Dynamics: crear la Oportunidad (Centro de ventas, w-it.crm2.dynamics.com)
#
# ⚠️ ESTADO: implementación PARCIAL a propósito.
#
# El formulario real de Oportunidad en este ambiente tiene varios campos
# PERSONALIZADOS marcados como obligatorios en el formulario (según captura
# compartida): Cuenta*, Con Microsoft*, Requerimiento*, Venta de licencias*,
# Consultor principal*, además de Orden de Compra, Tipo de cuenta, AM de
# Microsoft, Congelar, Es licitación, Situación actual, Necesidad del
# cliente, Solución propuesta. Ninguno de esos es un campo estándar de
# Dataverse — sus nombres lógicos (schema name) son específicos de este
# ambiente y NO deben adivinarse: la lección del simulador de la propuesta
# CMP mostró que un nombre "razonable" casi nunca es el nombre lógico real,
# y un valor de choice (opción de lista) mal adivinado puede crear un
# registro con datos incorrectos en vez de fallar limpiamente.
#
# Por eso este código solo escribe los dos campos estándar y sin riesgo:
#   - name        (Tema)
#   - description (todo el resto del formulario web, en texto legible)
#
# Si el ambiente exige alguno de los campos personalizados para poder CREAR
# el registro (no solo para avanzarlo de etapa), esta llamada fallará con un
# 400 cuyo mensaje indica exactamente qué campo falta — se captura y no
# rompe el flujo completo: la notificación por correo (send_notification)
# de todas formas se envía, así ninguna solicitud se pierde mientras se
# completa el mapeo de campos personalizados (ver README.md, sección
# "Pendiente para completar Oportunidad").
# ---------------------------------------------------------------------------
def build_description(d, ip):
    intereses = ", ".join(d.get("intereses") or []) or "—"
    return (
        f"Solicitud de demo — Plataforma de Gestión de Consentimientos\n\n"
        f"Contacto: {d['nombre']} {d['apellido']}\n"
        f"Correo: {d['email']}\n"
        f"Teléfono: {d.get('telefono') or '—'}\n"
        f"Empresa: {d['empresa']}\n"
        f"Cargo: {d.get('cargo') or '—'}\n"
        f"Industria: {d.get('industria') or '—'}\n"
        f"Volumen de titulares: {d.get('volumen_titulares') or '—'}\n"
        f"Necesita resolver: {intereses}\n\n"
        f"Mensaje del prospecto:\n{d.get('mensaje') or '—'}\n\n"
        f"--- Evidencia de consentimiento del formulario ---\n"
        f"Autorizó el contacto: sí\n"
        f"Versión del texto: {d.get('consentimiento_version') or '—'}\n"
        f"Fecha/hora: {d.get('consentimiento_fecha') or '—'}\n"
        f"IP: {ip or '—'}\n"
        f"Origen: {d.get('origen') or '—'}\n"
        f"URL: {d.get('url') or '—'}\n"
        f"Referrer: {d.get('referrer') or '—'}"
    )


def create_opportunity(cfg, d, ip):
    payload = {
        "name":        f"{d['empresa']} — Solicitud demo Plataforma de Consentimientos",
        "description": build_description(d, ip),
        # TODO una vez confirmados los nombres lógicos reales (ver README):
        # "<campo_con_microsoft>": <valor choice>,
        # "<campo_requerimiento>": <valor choice>,
        # "<campo_venta_licencias>": <valor choice>,
        # "<campo_consultor_principal>@odata.bind": "/systemusers(<guid>)",
        # "customerid_account@odata.bind": f"/accounts({account_id})",  # si "Cuenta" es el lookup estándar
    }
    token = get_token(cfg, f"{cfg['url']}/.default")
    opp = d365(cfg, token, "POST", "opportunities", payload)
    return opp.get("opportunityid", ""), opp.get("name", d["empresa"])


# ---------------------------------------------------------------------------
# Notificación por correo — Microsoft Graph sendMail, reutilizando el mismo
# App Registration (requiere el permiso de aplicación Mail.Send, con
# consentimiento de administrador, y que MAIL_FROM sea un buzón real con
# licencia). No se usa SMTP: Exchange Online tiene deprecado SMTP AUTH
# básico en la mayoría de los tenants nuevos, y así se evita mantener un
# segundo juego de credenciales.
# ---------------------------------------------------------------------------
def build_email_body(d, lead_note):
    intereses = ", ".join(d.get("intereses") or []) or "—"
    return (
        f"Nueva solicitud de demo\n\n"
        f"Nombre: {d['nombre']} {d['apellido']}\n"
        f"Correo: {d['email']}\n"
        f"Teléfono: {d.get('telefono') or '—'}\n"
        f"Empresa: {d['empresa']}\n"
        f"Cargo: {d.get('cargo') or '—'}\n"
        f"Industria: {d.get('industria') or '—'}\n"
        f"Volumen de titulares: {d.get('volumen_titulares') or '—'}\n"
        f"Necesita resolver: {intereses}\n\n"
        f"Mensaje:\n{d.get('mensaje') or '—'}\n\n"
        f"{lead_note}"
    )


def send_notification(cfg, d, opportunity_id):
    if not (cfg["mail_from"] and cfg["mail_to"]):
        logging.warning("MAIL_FROM/MAIL_TO no configurados: se omite el correo")
        return False
    note = (f"Oportunidad creada en Dynamics: {opportunity_id}" if opportunity_id
            else "⚠️ No se pudo crear la Oportunidad en Dynamics — revisar logs (probable campo personalizado obligatorio faltante).")
    token = get_token(cfg, "https://graph.microsoft.com/.default")
    message = {
        "message": {
            "subject": f"Solicitud de demo — {d['empresa']}",
            "body": {"contentType": "Text", "content": build_email_body(d, note)},
            "toRecipients": [{"emailAddress": {"address": cfg["mail_to"]}}],
            "replyTo": [{"emailAddress": {"address": d["email"]}}],
        }
    }
    graph(token, "POST", f"users/{cfg['mail_from']}/sendMail", message)
    return True


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
@app.after_request
def add_cors(resp):
    cfg = get_config()
    origin = request.headers.get("Origin", "")
    allowed = [o.strip() for o in cfg["origins"].split(",") if o.strip()]
    resp.headers["Access-Control-Allow-Origin"] = origin if origin in allowed else (allowed[0] if allowed else "")
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "lead-a-dynamics"}), 200


@app.route("/api/lead", methods=["OPTIONS"])
def preflight():
    return "", 204


@app.route("/api/lead", methods=["POST"])
def lead():
    try:
        cfg = get_config()
        body = request.get_json(force=True) or {}

        # Trampa anti-spam (honeypot): si el campo oculto viene relleno,
        # se descarta en silencio devolviendo éxito, sin tocar Dynamics/correo.
        if (body.get("_hp") or "").strip():
            return jsonify({"ok": True})

        nombre  = (body.get("nombre", "")  or "").strip()
        apellido = (body.get("apellido", "") or "").strip()
        email   = (body.get("email", "")   or "").strip()
        empresa = (body.get("empresa", "") or "").strip()

        if not (nombre and apellido and email and empresa):
            return jsonify({"ok": False, "msg": "Campos requeridos vacíos"}), 400
        if not body.get("consentimiento_contacto"):
            return jsonify({"ok": False, "msg": "Falta la autorización de contacto"}), 400

        captcha_token = (body.get("captchaToken", "") or "").strip()
        if not verify_recaptcha(cfg["recaptcha_secret"], captcha_token):
            return jsonify({"ok": False, "msg": "Verificación de seguridad fallida. Recargue e intente nuevamente."}), 400

        if not cfg["tenant"]:
            return jsonify({"ok": False, "msg": "Servidor no configurado"}), 500

        ip = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
        d = {
            "nombre": nombre, "apellido": apellido, "email": email, "empresa": empresa,
            "telefono": (body.get("telefono", "") or "").strip(),
            "cargo": (body.get("cargo", "") or "").strip(),
            "industria": body.get("industria", ""),
            "volumen_titulares": body.get("volumen_titulares", ""),
            "intereses": body.get("intereses") or [],
            "mensaje": (body.get("mensaje", "") or "").strip(),
            "consentimiento_version": body.get("consentimiento_version", ""),
            "consentimiento_fecha": body.get("consentimiento_fecha", ""),
            "origen": body.get("origen", ""),
            "url": body.get("url", ""),
            "referrer": body.get("referrer", ""),
        }

        opportunity_id, opp_ok, mail_ok = "", False, False
        try:
            opportunity_id, _ = create_opportunity(cfg, d, ip)
            opp_ok = bool(opportunity_id)
        except Exception:
            logging.exception("Error creando la Oportunidad en Dynamics")

        try:
            mail_ok = send_notification(cfg, d, opportunity_id)
        except Exception:
            logging.exception("Error enviando la notificación por correo")

        # El envío se considera exitoso si al menos uno de los dos canales
        # (CRM o correo) funcionó — así una falla puntual de un canal no
        # hace perder la solicitud completa. Mientras falten por confirmar
        # los campos personalizados obligatorios de Oportunidad (ver
        # README.md), es normal que opp_ok sea False y el correo sea el
        # canal que efectivamente entrega la solicitud.
        if opp_ok or mail_ok:
            return jsonify({"ok": True, "opportunityid": opportunity_id, "mail_sent": mail_ok})
        return jsonify({"ok": False, "msg": "No se pudo registrar la solicitud. Intente nuevamente o escríbanos directamente."}), 502

    except Exception as e:
        logging.exception("Error inesperado en /api/lead")
        return jsonify({"ok": False, "msg": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
