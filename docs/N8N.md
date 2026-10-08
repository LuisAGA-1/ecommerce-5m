# Automatización con n8n

[n8n](https://n8n.io) es una herramienta de automatización de flujos de trabajo de código abierto. Este proyecto la usa para dos cosas:

| Flujo | Archivo | Qué hace |
|---|---|---|
| **Pedido creado** | `n8n/01-pedido-creado-notificaciones.json` | Recibe cada pedido nuevo desde el backend y envía el comprobante al cliente y el aviso al administrador. Incluye un nodo de Telegram opcional. |
| **Reporte semanal** | `n8n/02-reporte-semanal.json` | Cada lunes a las 8:00 consulta `GET /api/reportes/dashboard` de la semana anterior y envía el resumen por correo al administrador. |

## Cómo encaja en la arquitectura hexagonal

```text
OrderService ──usa──> EmailServicePort (puerto, sin cambios)
                              ▲
              ┌───────────────┼──────────────────────┐
     NodemailerAdapter   N8nWebhookAdapter    EmailServiceConRespaldo
     (envío directo)     (POST al webhook)    (n8n → si falla, Nodemailer)
                              │
                              ▼
                     n8n: Webhook → IF → Send Email / Telegram / …
```

- `N8nWebhookAdapter` (`backend/src/infrastructure/notifications/`) es **otra implementación del mismo puerto** `EmailServicePort`. `OrderService` no cambió ni una línea.
- La fábrica `crearServicioNotificaciones` elige el adaptador según `EMAIL_PROVIDER`:
  - `ethereal`, `mailtrap` o `smtp` → Nodemailer.
  - `n8n` → n8n, con respaldo de Nodemailer.
  - `none` → sin notificaciones.
- Si n8n está apagado o tarda más de `N8N_TIMEOUT_MS`, `EmailServiceConRespaldo` envía el correo con Nodemailer y el pedido nunca se pierde.
- El backend manda a n8n los **datos del pedido** y el **correo ya armado** (`correo.subject` y `correo.html`, con las mismas plantillas de siempre). n8n solo decide por dónde enviarlo.

### Evento que recibe n8n

```json
{
  "evento": "pedido.creado",
  "destinatario": "cliente",
  "para": "cliente@gmail.com",
  "tienda": "Tienda 5M",
  "pedido": {
    "id": 17, "folio": "PED-000017", "fecha": "2026-10-08T16:28:00.000Z",
    "estado": "PENDIENTE", "estadoEtiqueta": "Pendiente de pago", "total": 21099,
    "detalles": [{ "producto": "Laptop Lenovo IdeaPad", "cantidad": 1, "precioUnitario": 16500, "subtotal": 16500 }]
  },
  "cliente": { "id": 12, "nombre": "cliente", "email": "cliente@gmail.com" },
  "pago": { "banco": "BBVA México", "clabe": "012100001234567895", "referencia": "PED-000017", "...": "..." },
  "correo": { "subject": "Comprobante de pedido PED-000017 – Pendiente de pago", "html": "<!doctype html>…", "text": "…" },
  "enviadoEn": "2026-10-08T16:28:01.120Z"
}
```

Para el administrador llega el mismo evento con `"destinatario": "admin"` y `urlPanel`. La petición incluye el header `X-Webhook-Secret` con el valor de `N8N_WEBHOOK_SECRET`.

## Puesta en marcha (local)

### 1. Levantar n8n

Elige una de las dos opciones.

**Opción A: con Node** (requiere Node 20 o superior; revisa tu versión con `node -v`):

```bash
npx n8n
```

**Opción B: con Docker:**

```bash
cd ~/webapp/n8n
docker compose up -d
```

En ambos casos se abre en **http://localhost:5678**. La primera vez te pide crear una cuenta local de propietario.

### 2. Crear la credencial SMTP en n8n

Ve a **Credentials → Add credential → SMTP** y usa la misma cuenta de Ethereal de `backend/.env`:

| Campo | Valor |
|---|---|
| User | tu `SMTP_USER` (ej. `xxxx@ethereal.email`) |
| Password | tu `SMTP_PASS` |
| Host | `smtp.ethereal.email` |
| Port | `587` |
| SSL/TLS | desactivado |

### 3. Importar los flujos

**Workflows → Import from File** y elige:

1. `n8n/01-pedido-creado-notificaciones.json`
   - Abre **Correo al cliente** y **Correo al administrador**, y selecciona tu credencial SMTP.
   - En **Validar secreto**, el valor debe coincidir con `N8N_WEBHOOK_SECRET` (por defecto `cambia-este-secreto`).
   - Actívalo con el switch **Active** de arriba a la derecha.
2. `n8n/02-reporte-semanal.json`
   - En **Consultar dashboard**, pega tu `REPORTES_API_KEY` en el header `X-API-Key`.
   - Si usas Docker, cambia `localhost` por `host.docker.internal` en la URL.
   - Selecciona la credencial SMTP en **Enviar reporte al admin**.
   - Pruébalo con **Ejecutar ahora (prueba)** → *Test workflow*.

> **URL de producción y de prueba:** con el flujo **activo**, el webhook escucha en `/webhook/pedido-creado`, que es la que usa el backend. La URL `/webhook-test/...` solo funciona mientras presionas *Listen for test event* en el editor.

### 4. Configurar el backend (`backend/.env`)

```bash
EMAIL_PROVIDER=n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook/pedido-creado
N8N_WEBHOOK_SECRET=cambia-este-secreto
N8N_TIMEOUT_MS=5000
N8N_RESPALDO=ethereal

# Genera una clave larga para el reporte semanal:
#   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
REPORTES_API_KEY=<pega aquí la clave generada>
```

Reinicia el backend con `npm run dev`.

### 5. Probar

1. Haz un pedido como cliente en `http://localhost:5173`.
2. En la terminal del backend verás `[n8n] Evento pedido.creado (cliente) entregado a n8n` y lo mismo para `(admin)`.
3. En n8n, en **Executions**, aparece la ejecución con cada nodo en verde.
4. Los correos llegan a tu bandeja de Ethereal, igual que antes, pero ahora los envía n8n.
5. Para probar el respaldo, detén n8n y haz otro pedido. El backend registra `Falló el adaptador principal… usando respaldo` y el correo llega igual.

Para probar el reporte semanal sin esperar al lunes:

```bash
# Comprobar la API key desde la terminal
curl -H "X-API-Key: TU_CLAVE" "http://localhost:3000/api/reportes/resumen"
```

Luego, en n8n, abre el flujo **Reporte semanal** y presiona **Test workflow**.

## Seguridad

- **Webhook:** el flujo descarta peticiones cuyo `X-Webhook-Secret` no coincide.
- **API key:**
  - Da acceso **solo de lectura** a `/api/reportes`.
  - Se compara en tiempo constante.
  - Si `REPORTES_API_KEY` está vacía o mide menos de 24 caracteres, esa vía queda deshabilitada.
- No subas `backend/.env` a GitHub. Los flujos exportados no contienen credenciales, porque n8n las guarda aparte.
