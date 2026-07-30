# lead-a-dynamics

Backend intermediario para el formulario **"Solicitar demo"** de
`plataforma-consentimientos`: crea una **Oportunidad** en el Centro de
Ventas de Dynamics 365 (**`https://w-it.crm2.dynamics.com/`**, el CRM
comercial real de W-IT) y envía un correo de notificación (Microsoft
Graph), sin exponer credenciales en el navegador.

Adaptado desde la integración ya probada en SIGALU (ver `GUIA-BASE-SIGALU.md`
en esta misma carpeta para el detalle completo de cada trampa ya resuelta:
comando de inicio de gunicorn, codificación de URLs OData, CORS, lectura de
variables de entorno en tiempo de petición, etc.). Este README cubre solo lo
que cambia respecto a esa guía base.

## Qué es distinto respecto a la guía base (SIGALU)

| | SIGALU (guía base) | Este backend |
|---|---|---|
| Entidad Dynamics | `incidents` (Caso) | **`opportunities`** (Oportunidad) |
| Ambiente | demo de un cliente | **CRM comercial real de W-IT** |
| Requiere `customerid` | Sí, obligatorio | No a nivel de API — pero el **formulario** del ambiente marca "Cuenta" como obligatoria (ver más abajo) |
| Notificación por correo | No incluida | **Sí — Microsoft Graph `sendMail`**, reutilizando el mismo App Registration |
| Endpoint | `/api/contacto` | `/api/lead` |

## ⚠️ Estado actual: implementación parcial a propósito

El formulario de Oportunidad en `w-it.crm2.dynamics.com` (Centro de ventas)
tiene varios campos **personalizados** marcados como obligatorios:
**Cuenta**, **Con Microsoft**, **Requerimiento**, **Venta de licencias**,
**Consultor principal** — además de otros no marcados con asterisco pero
presentes en el formulario: Orden de Compra, Tipo de cuenta, AM de
Microsoft, Congelar, Es licitación, Situación actual, Necesidad del
cliente, Solución propuesta.

Ninguno de esos es un campo estándar de Dataverse: sus **nombres lógicos**
(schema name) son específicos de este ambiente. La lección del simulador de
API de la propuesta CMP mostró que adivinar esos nombres —o el valor
numérico de una opción de lista (choice)— casi nunca acierta, y en el peor
caso no falla limpiamente sino que **crea el registro con datos
incorrectos**. Por eso `create_opportunity()` en `app.py` hoy solo escribe:

- `name` (Tema) — con el nombre de la empresa
- `description` — con todo el resto de los datos del formulario, en texto

Si el ambiente exige alguno de los campos personalizados para poder
**crear** el registro (no solo para avanzarlo de etapa en el proceso de
venta), la llamada a Dynamics fallará con 400 y el mensaje de error exacto
quedará en los logs de Application Insights. Esa falla **no rompe la
solicitud**: el correo de notificación (Graph) se envía de todas formas, así
que ninguna solicitud del formulario se pierde mientras se completa el
mapeo.

### Qué se necesita para completar el mapeo (pendiente)

Para cada uno de estos, el nombre lógico exacto y — si es una lista de
opciones (choice) — los valores numéricos válidos:

- [ ] **Cuenta** — ¿es el lookup polimórfico estándar (`customerid`) o un
      campo personalizado? Si hay que enlazar una Cuenta existente por
      nombre de empresa, definir la lógica de búsqueda/creación (ver
      "Cuenta u contacto" en `GUIA-BASE-SIGALU.md`, sección 5d, para el
      patrón equivalente ya resuelto con Contactos).
- [ ] **Con Microsoft** (choice Sí/No) — nombre lógico + valores.
- [ ] **Requerimiento** (choice, incluye "Otro") — nombre lógico + lista completa de valores.
- [ ] **Venta de licencias** (choice Sí/No) — nombre lógico + valores.
- [ ] **Consultor principal** (lookup a usuario) — nombre lógico + a
      quién/qué equipo asignar por defecto las oportunidades que llegan por
      el formulario web (no hay una persona "obvia" para un lead entrante,
      hay que decidirlo).
- [ ] Confirmar cuáles de los campos anteriores son realmente obligatorios
      **a nivel de API** al crear el registro (vs. solo obligatorios en ese
      formulario/etapa específica del proceso de venta) — la forma más
      directa de saberlo es probar la creación y leer el mensaje de error.

**Cómo obtener los nombres lógicos** (mismo método que en el simulador CMP,
ver `app.py` función `d365()` y usarlo con una consulta de solo lectura):

```
GET https://w-it.crm2.dynamics.com/api/data/v9.2/EntityDefinitions(LogicalName='opportunity')/Attributes?$select=LogicalName,DisplayName,AttributeType&$filter=IsCustomAttribute eq true
```

(requiere sesión autenticada en ese ambiente, o el token del App
Registration una vez creado — ver checklist de configuración más abajo).

## Variables de entorno

Ver `.env.example`. Resumen de lo que hay que reunir antes de configurar Azure:

- **Tenant ID, Client ID, Client Secret** — de la App Registration en Entra ID.
- **D365_URL** — confirmado: `https://w-it.crm2.dynamics.com`
- **MAIL_FROM** — buzón real con licencia Exchange Online que enviará la notificación.
- **MAIL_TO** — `ventas@regulatec.cl` (o el que corresponda).
- **RECAPTCHA_SECRET** — de [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin/create) (v2 "No soy un robot"). Opcional al principio: si no está configurado, el backend igual funciona (sin bloquear por captcha), para poder probar de punta a punta antes de endurecer.

## Permisos que necesita la App Registration

1. **Dynamics**: Application User creado en `w-it.crm2.dynamics.com`, con un rol de seguridad que permita crear registros `opportunities` (y `accounts`/`contacts` si se termina implementando la búsqueda/creación de Cuenta).
2. **Microsoft Graph**: permiso de **aplicación** `Mail.Send`, con **consentimiento de administrador** otorgado (Azure Portal → Entra ID → Registros de aplicaciones → tu app → Permisos de API → Agregar un permiso → Microsoft Graph → Permisos de aplicación → `Mail.Send` → Conceder consentimiento de administrador).

## Checklist de configuración (pasos manuales — solo el equipo puede hacerlos)

- [ ] Crear o reutilizar la **App Registration** en Entra ID; generar el Client Secret.
- [ ] Crear el **Application User** en `w-it.crm2.dynamics.com` con esa App ID y asignarle rol de seguridad sobre `opportunities`.
- [ ] Agregar el permiso de aplicación **Mail.Send** (Graph) a la App Registration y otorgar consentimiento de administrador.
- [ ] Confirmar el **buzón MAIL_FROM** (licencia Exchange Online activa).
- [ ] Obtener los **nombres lógicos y valores de choice** de los campos personalizados de Oportunidad (ver sección de arriba) y completar `create_opportunity()` en `app.py`.
- [ ] Decidir el **Consultor principal por defecto** para oportunidades entrantes desde el formulario web.
- [ ] Crear el **App Service** (Linux, Python 3.11, plan gratuito F1) — ver `GUIA-BASE-SIGALU.md` sección 4.
- [ ] Configurar el **comando de inicio**: `gunicorn --bind=0.0.0.0:8000 --workers=2 app:app`
- [ ] Cargar las **variables de entorno** en Azure (ver `.env.example`).
- [ ] Conectar **GitHub** desde el Centro de implementación del App Service.
- [ ] Reemplazar el workflow autogenerado por Azure usando `github-workflow-template.yml` como base (ajustar `<nombre-app>` y los nombres de secreto reales).
- [ ] Registrar el sitio en **reCAPTCHA v2** y obtener el site key (para el frontend) y el secret (para `RECAPTCHA_SECRET`).
- [ ] Pegar la URL final del App Service en `CRM.endpoint`, dentro de `plataforma-consentimientos/js/lead.js`.
- [ ] Probar de punta a punta (ver sección 10 de `GUIA-BASE-SIGALU.md`): health check → curl directo → formulario real → confirmar Oportunidad en Dynamics y correo recibido.
