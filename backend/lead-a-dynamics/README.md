# lead-a-dynamics

Backend intermediario para el formulario **"Solicitar demo"** de
`plataforma-consentimientos`: crea un **Lead** en Dynamics 365 y envía un
correo de notificación (Microsoft Graph), sin exponer credenciales en el
navegador.

Adaptado desde la integración ya probada en SIGALU (ver `GUIA-BASE-SIGALU.md`
en esta misma carpeta para el detalle completo de cada trampa ya resuelta:
comando de inicio de gunicorn, codificación de URLs OData, CORS, lectura de
variables de entorno en tiempo de petición, etc.). Este README cubre solo lo
que cambia respecto a esa guía base.

## Qué es distinto respecto a la guía base (SIGALU)

| | SIGALU (guía base) | Este backend |
|---|---|---|
| Entidad Dynamics | `incidents` (Caso) | **`leads`** (Lead) |
| Requiere `customerid` | Sí, obligatorio | **No** — un Lead no exige contacto/cuenta previo |
| Resuelve/crea Contacto primero | Sí | No — se crea el Lead directo |
| Notificación por correo | No incluida | **Sí — Microsoft Graph `sendMail`**, reutilizando el mismo App Registration |
| Endpoint | `/api/contacto` | `/api/lead` |

## Variables de entorno

Ver `.env.example`. Resumen de lo que hay que reunir antes de configurar Azure:

- **Tenant ID, Client ID, Client Secret** — de la App Registration en Entra ID.
- **D365_URL** — el ambiente Dynamics que debe recibir los leads comerciales.
  ⚠️ No confundir con un ambiente de demostración usado para otro cliente/propuesta.
- **MAIL_FROM** — buzón real con licencia Exchange Online que enviará la notificación.
- **MAIL_TO** — `ventas@regulatec.cl` (o el que corresponda).
- **RECAPTCHA_SECRET** — de [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin/create) (v2 "No soy un robot"). Opcional al principio: si no está configurado, el backend igual funciona (sin bloquear por captcha), para poder probar de punta a punta antes de endurecer.

## Permisos que necesita la App Registration

1. **Dynamics**: Application User creado en el ambiente Dynamics de destino, con un rol de seguridad que permita crear registros `leads`.
2. **Microsoft Graph**: permiso de **aplicación** `Mail.Send`, con **consentimiento de administrador** otorgado (Azure Portal → Entra ID → Registros de aplicaciones → tu app → Permisos de API → Agregar un permiso → Microsoft Graph → Permisos de aplicación → `Mail.Send` → Conceder consentimiento de administrador para \<tenant\>).

## Checklist de configuración (pasos manuales — solo el equipo puede hacerlos)

- [ ] Confirmar **cuál Dynamics** recibe estos leads (URL del ambiente comercial real).
- [ ] Crear o reutilizar la **App Registration** en Entra ID; generar el Client Secret.
- [ ] Crear el **Application User** en Dynamics con esa App ID y asignarle rol de seguridad sobre `leads`.
- [ ] Agregar el permiso de aplicación **Mail.Send** (Graph) a la App Registration y otorgar consentimiento de administrador.
- [ ] Confirmar el **buzón MAIL_FROM** (licencia Exchange Online activa).
- [ ] Crear el **App Service** (Linux, Python 3.11, plan gratuito F1) — ver `GUIA-BASE-SIGALU.md` sección 4.
- [ ] Configurar el **comando de inicio**: `gunicorn --bind=0.0.0.0:8000 --workers=2 app:app`
- [ ] Cargar las **variables de entorno** en Azure (ver `.env.example`).
- [ ] Conectar **GitHub** desde el Centro de implementación del App Service.
- [ ] Reemplazar el workflow autogenerado por Azure usando `github-workflow-template.yml` como base (ajustar `<nombre-app>` y los nombres de secreto reales).
- [ ] Registrar el sitio en **reCAPTCHA v2** y obtener el site key (para el frontend) y el secret (para `RECAPTCHA_SECRET`).
- [ ] Pegar la URL final del App Service en `CRM.endpoint`, dentro de `plataforma-consentimientos/js/lead.js`.
- [ ] Probar de punta a punta (ver sección 10 de `GUIA-BASE-SIGALU.md`): health check → curl directo → formulario real → confirmar Lead en Dynamics y correo recibido.
