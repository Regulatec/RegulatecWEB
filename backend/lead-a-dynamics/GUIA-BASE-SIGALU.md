# Guía: Integrar un formulario web con Dynamics 365 vía Azure

**Objetivo:** que un formulario HTML público (sitio estático, landing page, etc.) cree registros (Casos, Leads, Contactos) directamente en un ambiente Dynamics 365, sin exponer credenciales al navegador.

**Caso de referencia:** integración del formulario de contacto de SIGALU con Dynamics 365 (ambiente `demopo.crm2.dynamics.com`), usando Azure App Service como backend intermediario.

---

## 1. Arquitectura general

Un formulario en un sitio estático (GitHub Pages, cualquier hosting) **nunca** debe llamar directamente a la API de Dynamics, porque eso obligaría a exponer un client secret en el HTML/JS público. La solución es un backend intermediario:

```
Sitio estático          Backend (Azure)              Dynamics 365
formulario.html   POST   App Service / Function   →   API Web (OData v9.2)
                  ────▶   guarda credenciales             crea Contacto + Caso
                          hace OAuth2 + llamadas
```

El backend es el único que conoce las credenciales y es el único que habla con Dynamics.

---

## 2. Prerrequisitos

Antes de empezar, reunir:

| Dato | Dónde se obtiene |
|---|---|
| **Tenant ID** (Id. de directorio) | Azure AD / Entra ID → registro de la app |
| **Client ID** (Id. de aplicación) | Azure AD / Entra ID → registro de la app |
| **Client Secret** | Azure AD / Entra ID → Certificados y secretos (se genera una sola vez, copiarlo al crearlo) |
| **URL del ambiente Dynamics** | Ej: `https://midominio.crm2.dynamics.com` (sin `/` final) |
| **Permiso de la app en Dynamics** | La Application User debe existir en Dynamics con un rol de seguridad (mínimo acceso a Contactos e Incidents/Casos) |

> Si no existe una **App Registration** en Azure AD con permisos sobre Dynamics, hay que crearla primero (Azure Portal → Entra ID → Registros de aplicaciones → Nuevo registro → API permissions → Dynamics CRM → luego crear un **Application User** dentro de Dynamics con esa misma App ID y asignarle un rol de seguridad).

---

## 3. Elegir el servicio de Azure para el backend

Dos opciones evaluadas en la práctica:

| Opción | Recomendación |
|---|---|
| **Azure Function (plan Flex Consumption)** | ⚠️ Evitar. En pruebas reales, el plan Flex Consumption presentó un bug conocido: el deploy vía GitHub Actions terminaba en verde pero **la función nunca quedaba registrada** (404 permanente en el endpoint). |
| **Azure App Service (Linux, plan F1 Gratis)** | ✅ Recomendado. Simple, gratuito para bajo tráfico, funciona con Flask/Python de forma predecible vía GitHub Actions. |

Esta guía documenta la ruta **App Service + Flask**, que es la que funcionó de forma estable.

---

## 4. Crear el App Service en Azure

1. Azure Portal → **Crear un recurso** → **Aplicación web**
2. Completar:
   - **Grupo de recursos**: crear uno nuevo o usar existente
   - **Nombre**: será parte de la URL pública (`nombre.azurewebsites.net`)
   - **Publicar**: Código
   - **Pila del entorno en tiempo de ejecución**: Python 3.11
   - **Sistema operativo**: **Linux** (obligatorio — Windows no soporta Python en App Service)
   - **Región**: la más cercana
   - **Plan de App Service**: **F1 (Gratis)**
3. Crear.

---

## 5. Código del backend (Flask)

Estructura mínima de carpeta (ej. `backend/azure-webapp/`):

```
azure-webapp/
├── app.py
├── requirements.txt
└── startup.sh          (opcional, referencia)
```

### `requirements.txt`

```
flask>=3.0
gunicorn>=21.0
```

### `app.py` — puntos clave

**a) Leer credenciales en tiempo de petición, no al iniciar el proceso.** Si el import falla al arrancar (por ejemplo, una env var faltante lanza `KeyError` a nivel de módulo), Azure levanta un **503 Application Error** genérico y es muy difícil diagnosticar. Usar `os.environ.get(...)` con default vacío, y validar dentro de cada request.

```python
def get_config():
    return {
        "tenant":  os.environ.get("D365_TENANT_ID", ""),
        "client":  os.environ.get("D365_CLIENT_ID", ""),
        "secret":  os.environ.get("D365_CLIENT_SECRET", ""),
        "url":     os.environ.get("D365_URL", "").rstrip("/"),
        "origins": os.environ.get("ALLOWED_ORIGINS", ""),
    }
```

**b) Obtener el token OAuth2 (client credentials flow):**

```python
def get_token(cfg):
    url  = f"https://login.microsoftonline.com/{cfg['tenant']}/oauth2/v2.0/token"
    body = urllib.parse.urlencode({
        "grant_type":    "client_credentials",
        "client_id":     cfg["client"],
        "client_secret": cfg["secret"],
        "scope":         f"{cfg['url']}/.default",
    }).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]
```

**c) Llamar a la Web API de Dynamics — ⚠️ trampa importante con espacios en URLs OData.**

Los filtros OData (`$filter=emailaddress1 eq 'x@y.com'`) contienen espacios literales. Python's `urllib.request` **rechaza URLs con espacios sin codificar** (`InvalidURL: URL can't contain control characters`). Hay que codificar el path completo, preservando los caracteres especiales de OData:

```python
def d365(cfg, token, method, path, payload=None):
    safe_path = urllib.parse.quote(path, safe="=&$?/@(),'")
    url  = f"{cfg['url']}/api/data/v9.2/{safe_path}"
    data = json.dumps(payload).encode() if payload else None
    req  = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization",    f"Bearer {token}")
    req.add_header("Content-Type",     "application/json; charset=utf-8")
    req.add_header("Accept",           "application/json")
    req.add_header("OData-MaxVersion", "4.0")
    req.add_header("OData-Version",    "4.0")
    req.add_header("Prefer",           "return=representation")
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise Exception(f"Dynamics {e.code}: {body}")
```

**d) Buscar-o-crear el Contacto antes del Caso — ⚠️ trampa importante: `customerid` es obligatorio.**

Al crear un `incident` (Caso), Dynamics **rechaza la petición con 400** y el mensaje *"Debe especificar un contacto o una cuenta"* si no se envía `customerid`. Hay que resolver primero el contacto (buscar por email; si no existe, crearlo) y vincularlo con la sintaxis `@odata.bind`:

```python
def get_or_create_contact(cfg, token, nombre, email, telefono="", empresa=""):
    email_enc = urllib.parse.quote(email, safe="@.")
    result = d365(cfg, token, "GET",
        f"contacts?$filter=emailaddress1 eq '{email_enc}'&$select=contactid&$top=1")
    vals = result.get("value", [])
    if vals:
        return vals[0]["contactid"]
    parts = nombre.strip().split(" ", 1)
    payload = {
        "firstname":     parts[0],
        "lastname":      parts[1] if len(parts) > 1 else ".",
        "emailaddress1": email,
    }
    if telefono: payload["telephone1"] = telefono
    if empresa:  payload["company"]    = empresa   # ⚠️ NO es "companyname" — ese campo no existe en Contact
    contact = d365(cfg, token, "POST", "contacts", payload)
    return contact.get("contactid", "")
```

```python
# Al crear el incident:
payload = {
    "title":          f"Contacto web de: {nombre}",
    "description":    descripcion,
    "caseorigincode": 3,   # 3 = Web
}
if contact_id:
    payload["customerid_contact@odata.bind"] = f"/contacts({contact_id})"

incident      = d365(cfg, token, "POST", "incidents", payload)
case_id       = incident.get("incidentid", "")
ticket_number = incident.get("ticketnumber", case_id)  # número legible: CAS-XXXXX-XXXXXX
```

> **Nota sobre nombres de campo:** los nombres lógicos de campo cambian según la personalización del ambiente. Si un `POST`/`PATCH` devuelve `400` con `"Invalid property 'X' was found in entity..."`, el campo no existe con ese nombre en esa instancia — hay que revisar el modelo de datos real (Configuración → Personalizaciones → Tablas → Contact, o usar `$metadata`).

**e) CORS — el navegador bloqueará las llamadas sin esto:**

```python
@app.after_request
def add_cors(resp):
    cfg    = get_config()
    origin = request.headers.get("Origin", "")
    allowed = [o.strip() for o in cfg["origins"].split(",")]
    resp.headers["Access-Control-Allow-Origin"]  = origin if origin in allowed else allowed[0]
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp

@app.route("/api/contacto", methods=["OPTIONS"])
def preflight():
    return "", 204
```

**f) Endpoint de salud** (facilita diagnosticar si el App Service arrancó bien, independiente de Dynamics):

```python
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "MiFormulario API"}), 200
```

**g) Manejo de errores con detalle para depuración** (quitar el traceback completo en producción, dejar solo el mensaje):

```python
except Exception as e:
    import traceback
    logging.error(traceback.format_exc())
    return jsonify({"ok": False, "msg": str(e)}), 500
```

---

## 6. Configurar el comando de inicio en App Service

Azure App Service para Python **no detecta Flask automáticamente** — hay que indicarle el comando de arranque:

1. App Service → **Configuración** → **Configuración de la pila** → **Comando de inicio**
2. Escribir:
   ```
   gunicorn --bind=0.0.0.0:8000 --workers=2 app:app
   ```
3. Guardar.

Sin este paso, la app responde **503 Application Error** aunque el deploy haya sido exitoso.

---

## 7. Variables de entorno en Azure

App Service → **Configuración** → **Variables de entorno** → agregar una por una:

| Nombre | Valor | Notas |
|---|---|---|
| `D365_TENANT_ID` | GUID del tenant | |
| `D365_CLIENT_ID` | GUID de la app registration | |
| `D365_CLIENT_SECRET` | El secret generado | Nunca subir a git |
| `D365_URL` | `https://midominio.crm2.dynamics.com` | Sin `/` al final |
| `ALLOWED_ORIGINS` | `https://midominio.github.io` | Dominio(s) del sitio, separados por coma |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` | Para que Azure instale `requirements.txt` automáticamente |

Después de guardar → **Aplicar** → **Confirmar**. Si se cambia algo después, conviene **reiniciar** el App Service para asegurar que tome los nuevos valores.

---

## 8. Deploy automático con GitHub Actions

1. App Service → **Implementación** → **Centro de implementación**
2. Origen: **GitHub** → autorizar → elegir organización, repositorio y rama
3. Azure genera automáticamente un workflow `.github/workflows/main_<nombre-app>.yml` con secretos OIDC (`AZUREAPPSERVICE_CLIENTID_...`, etc.) ya cargados en el repo — no hay que crearlos manualmente.

**⚠️ Trampa importante:** el workflow autogenerado por Azure asume que el código Flask está en la **raíz del repositorio**. Si el backend vive en una subcarpeta (ej. `backend/azure-webapp/`), hay que editar el workflow para:
- Instalar dependencias desde esa subcarpeta
- Empaquetar solo esa subcarpeta en el zip de deploy

Ejemplo de workflow corregido:

```yaml
name: Build and deploy Python app to Azure Web App - <nombre-app>

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  APP_PATH: 'backend/azure-webapp'

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd ${{ env.APP_PATH }}
          pip install -r requirements.txt
      - name: Upload artifact for deployment
        uses: actions/upload-artifact@v4
        with:
          name: python-app
          path: ${{ env.APP_PATH }}

  deploy:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: python-app
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_XXXX }}
          tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_XXXX }}
          subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_XXXX }}
      - uses: azure/webapps-deploy@v3
        with:
          app-name: '<nombre-app>'
          slot-name: 'Production'
          package: '.'
```

---

## 9. Frontend: el formulario HTML

Puntos clave del `fetch` desde el sitio estático:

```javascript
var API = 'https://<nombre-app>.azurewebsites.net/api/contacto';

fetch(API, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify({
    nombre: '...', email: '...', telefono: '...',
    empresa: '...', mensaje: '...'
  }),
})
.then(r => r.json())
.then(data => {
  if (data.ok) {
    // mostrar data.case (ticketnumber legible, ej: CAS-01009-M0K9M1)
  } else {
    // mostrar data.msg
  }
});
```

**Recomendación de seguridad — reCAPTCHA v2:**

1. Registrar el sitio en [google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create) (tipo v2 "No soy un robot")
2. Agregar en el `<head>`: `<script src="https://www.google.com/recaptcha/api.js" async defer></script>`
3. Agregar antes del botón submit: `<div class="g-recaptcha" data-sitekey="TU_SITE_KEY"></div>`
4. En el JS, exigir `grecaptcha.getResponse()` antes de enviar y resetear con `grecaptcha.reset()` después
5. Enviar el token en el payload (`captchaToken`) y **verificarlo en el backend** contra `https://www.google.com/recaptcha/api/siteverify` con el `RECAPTCHA_SECRET` (nunca confiar solo en la validación del frontend — es trivial de burlar con una llamada directa a la API)

---

## 10. Checklist de verificación end-to-end

Antes de dar por cerrada la integración, probar en este orden:

1. **Health check del backend:**
   ```bash
   curl https://<nombre-app>.azurewebsites.net/
   # → {"status":"ok",...}  (si da 503, revisar comando de inicio y logs)
   ```

2. **Petición directa al endpoint** (sin captcha, para aislar errores de Dynamics):
   ```bash
   curl -X POST https://<nombre-app>.azurewebsites.net/api/contacto \
     -H "Content-Type: application/json" \
     -d '{"nombre":"Prueba","email":"prueba@test.cl","mensaje":"test"}'
   ```
   - `400` con mensaje de Dynamics → revisar el mensaje literal (usualmente indica campo inválido o customerid faltante)
   - `500` genérico → revisar logs del App Service (Application Insights → Registros, o Secuencia de registro si el plan lo soporta)
   - `200` con `case` → integración funcionando

3. **Prueba real desde el navegador** con el captcha marcado, revisando la pestaña Network (F12) si algo falla — el `Response` de la petición trae el mensaje de error exacto.

4. **Confirmar en Dynamics** que el Contacto y el Caso se crearon correctamente (Dynamics → Servicio → Casos, o Ventas → Contactos).

---

## 11. Errores comunes y su causa (referencia rápida)

| Síntoma | Causa probable |
|---|---|
| `404` en el endpoint tras un deploy "exitoso" | Plan Flex Consumption de Azure Functions no registró la función — migrar a App Service |
| `503 Application Error` | Falta el comando de inicio (gunicorn), o una env var faltante rompe el import a nivel de módulo |
| `InvalidURL: URL can't contain control characters` | Espacios sin codificar en un filtro OData — usar `urllib.parse.quote` |
| `400 "Debe especificar un contacto o una cuenta"` | Falta `customerid_contact@odata.bind` (o `customerid_account@odata.bind`) al crear el incident |
| `400 "Invalid property 'X' was found in entity..."` | El campo no existe con ese nombre lógico en la tabla — revisar el modelo de datos real |
| CORS bloqueado en el navegador (consola) | Falta el header `Access-Control-Allow-Origin` — revisar `ALLOWED_ORIGINS` y el manejo de `OPTIONS` |
| El formulario envía pero el captcha nunca falla ni pasa | `RECAPTCHA_SECRET` no configurado en Azure, o el App Service no se reinició tras agregarlo |

---

## 12. Resumen de piezas necesarias por parte de quien integra

- [ ] App Registration en Azure AD con Application User creado en Dynamics y rol de seguridad asignado
- [ ] Tenant ID, Client ID, Client Secret, URL del ambiente
- [ ] Azure App Service (Linux, Python) creado con plan gratuito o el que corresponda
- [ ] Código Flask con: lectura de env vars en runtime, OAuth2 token, llamadas OData con paths codificados, resolución de contacto antes del caso, CORS
- [ ] Comando de inicio configurado (gunicorn)
- [ ] Variables de entorno cargadas en Azure
- [ ] GitHub Actions conectado y corregido si el código está en subcarpeta
- [ ] Formulario HTML con reCAPTCHA v2 y validación server-side
- [ ] Pruebas end-to-end (curl + navegador + verificación en Dynamics)
