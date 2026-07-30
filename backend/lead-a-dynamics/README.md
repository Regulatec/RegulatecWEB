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

### Ya confirmado contra `EntityDefinitions` (entidad `opportunity`)

| Campo del formulario | Nombre lógico | Tipo | Estado |
|---|---|---|---|
| Cuenta * | `customerid` (estándar — no aparece entre los personalizados) | Lookup polimórfico (Account/Contact) | Sin enlazar por decisión (ver abajo) |
| Con Microsoft * | `wit_conmicrosoft` | Boolean | ✅ Implementado (`OPP_DEFAULTS`, `app.py`) |
| Venta de licencias * | `wit_ventadelicencias` | Boolean | ✅ Implementado (`OPP_DEFAULTS`, `app.py`) |
| Consultor principal * | `wit_consultorprincipalid` | Lookup → `systemusers` | ⏳ Falta el GUID por defecto (`CONSULTOR_PRINCIPAL_DEFAULT_ID`) |
| Requerimiento * | `wit_requerimiento` | Picklist | ⏳ Falta el valor numérico de "Otro" (`REQUERIMIENTO_OTRO`) |
| Congelar | `wit_congelar` | Boolean | No implementado (no obligatorio) |
| Es licitación | `wit_esilicitacion` | Boolean | No implementado (no obligatorio) |
| Orden de Compra | `wit_ordendecompra` | String | No implementado (no obligatorio) |
| Tipo de cuenta | `wit_tipodecuenta` | Picklist | No implementado (no obligatorio) |
| AM de Microsoft | `wit_accountmanager` | Lookup | No implementado (no obligatorio) |
| Situación actual / Necesidad del cliente / Solución propuesta | no encontrados en la metadata leída | — | Van dentro de `description` (texto libre, sin riesgo) |

Si algún campo marcado con `*` en el formulario resulta ser obligatorio
también **a nivel de API** (no solo en ese formulario/etapa del proceso de
venta) y no está completo, la creación de la Oportunidad fallará con 400 y
el mensaje de error exacto quedará en los logs de Application Insights.
Esa falla **no rompe la solicitud**: el correo de notificación (Graph) se
envía de todas formas, así que ninguna solicitud del formulario se pierde
mientras se completa lo que falta.

### Pendiente para completar Oportunidad

- [ ] **Requerimiento** — obtener el valor numérico de la opción "Otro":
  ```
  GET https://w-it.crm2.dynamics.com/api/data/v9.2/EntityDefinitions(LogicalName='opportunity')/Attributes(LogicalName='wit_requerimiento')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet
  ```
  y completar `REQUERIMIENTO_OTRO` en `app.py`.
- [ ] **Consultor principal** — decidir el GUID del usuario/equipo que debe
      quedar como dueño por defecto de las oportunidades entrantes por el
      formulario web (no hay una persona "obvia" para un lead entrante),
      y completar `CONSULTOR_PRINCIPAL_DEFAULT_ID` en `app.py`.
- [ ] **Cuenta** (`customerid`) — decisión de negocio, no técnica: ¿se busca
      o crea automáticamente la Cuenta por nombre de empresa (riesgo:
      nombres que no calzan exacto generan duplicados), o se deja sin
      enlazar y el vendedor la vincula manualmente al revisar el correo de
      notificación? Mientras no se decida, queda sin enlazar.
- [ ] Confirmar si `wit_conmicrosoft` / `wit_ventadelicencias` deberían
      quedar en `True` por defecto para este producto específico (se
      construye sobre Power Platform/Dataverse) — hoy están en `False`
      (`OPP_DEFAULTS` en `app.py`).

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

- [x] Crear o reutilizar la **App Registration** en Entra ID; generar el Client Secret.
      Reutilizada: `WIT-CRM-CCR` (ya existente). Secreto `WEBLEADS` generado — ⚠️
      pendiente rotarlo antes de producción (quedó expuesto en un chat de
      configuración; ver nota de seguridad más abajo).
- [x] Crear el **Application User** en `w-it.crm2.dynamics.com` con esa App ID y asignarle rol de seguridad sobre `opportunities`.
      Ya existía para `WIT-CRM-CCR`. **Temporalmente con rol "Administrador del
      sistema"** para agilizar las pruebas end-to-end — ⚠️ **pendiente antes de
      producción:** crear el rol acotado `WIT - Integración Web Oportunidades`
      (Crear + Leer sobre Oportunidad, Leer sobre Cuenta, a nivel Organización)
      y reemplazar el rol de Administrador por este.
- [ ] Agregar el permiso de aplicación **Mail.Send** (Graph) a la App Registration y otorgar consentimiento de administrador.
- [ ] **Antes de ir a producción:** rotar el secreto `WEBLEADS` (generar uno
      nuevo y cargarlo directo en las variables de entorno de Azure, sin
      pasarlo por chat/email) y bajar el Application User del rol
      Administrador del sistema al rol acotado.
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
