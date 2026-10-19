# Automatización con n8n

[n8n](https://n8n.io) es una herramienta de automatización de flujos de trabajo de código abierto. Este proyecto la usa para tres cosas:

| Flujo | Archivo | Qué hace |
|---|---|---|
| **Pedido creado** | `n8n/01-pedido-creado-notificaciones.json` | Recibe cada pedido nuevo desde el backend y envía el comprobante al cliente y el aviso al administrador. Incluye un nodo de Telegram opcional. |
| **Reporte semanal** | `n8n/02-reporte-semanal.json` | Cada lunes a las 8:00 consulta `GET /api/reportes/dashboard` de la semana anterior y envía el resumen por correo al administrador. |
| **Bot de Telegram** | `n8n/03-bot-telegram-consultas.json` | Responde comandos en Telegram (`/pedido 17`, `/stock laptop`) consultando PostgreSQL con un usuario de solo lectura. |

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

## Bot de Telegram (ngrok + PostgreSQL)

```text
Telegram ──HTTPS──> ngrok ──túnel──> agente ngrok ──> n8n :5678 ──TCP──> PostgreSQL :5432
   ▲                                                    │
   └──────────── Send Message (HTTPS saliente) ─────────┘
```

Flujo: **Telegram Trigger → Switch → Postgres → Telegram Send Message**.

- El **Telegram Trigger** usa un webhook, así que Telegram necesita una **URL pública con HTTPS**. Como n8n corre en tu laptop, ngrok le da esa URL.
- Por el túnel solo pasa el tráfico hacia n8n. **PostgreSQL nunca queda expuesto a internet.**
- El bot entra a la base con `bot_lector`, un usuario que **solo puede leer** `pedidos` y `productos`.

### 1. Crear el bot

En Telegram, escríbele a **@BotFather** y mándale `/newbot`. Copia el **token** que te da y no lo subas a GitHub.

### 2. Usuario de solo lectura

Abre `n8n/bot-lector.sql`, cambia la contraseña y ejecútalo:

```bash
cd ~/webapp
sudo -u postgres psql -d ecommerce_db -f n8n/bot-lector.sql
```

### 3. ngrok

1. Instala ngrok (https://ngrok.com/download) y crea tu cuenta.
2. Pega tu token: `ngrok config add-authtoken TU_AUTHTOKEN`.
3. En el panel de ngrok, entra a **Domains** y reclama tu dominio gratis, por ejemplo `tu-dominio.ngrok-free.app`. Así la URL no cambia.

### 4. Arrancar todo con un solo comando

Agrega tu dominio de ngrok a `backend/.env` (solo una vez):

```bash
NGROK_DOMAIN=tu-dominio.ngrok-free.app
```

Desde ese momento, `npm run demo` levanta **PostgreSQL, backend, frontend, n8n y el túnel de ngrok**, y le pasa a n8n su URL pública para que registre el webhook de Telegram. Con Ctrl+C se apaga todo. Ya no hace falta abrir ngrok en otra terminal; si ya lo tienes abierto, la demo lo reutiliza.

```bash
cd ~/webapp
npm run demo
```

Al final debe aparecer `n8n público (bot)   https://tu-dominio...   ✔ listo`.

> **Docker:** `cd n8n && N8N_URL_PUBLICA=https://tu-dominio.ngrok-free.app/ docker compose up -d`, y abre ngrok aparte con `ngrok http --url=tu-dominio.ngrok-free.app 5678`.

Abre `https://tu-dominio.ngrok-free.app`. Si es la primera vez, crea tu cuenta de propietario con una **contraseña fuerte**: es la que protege tu n8n mientras el túnel está abierto.

### 5. Credenciales en n8n

En **Credentials → Add credential**:

| Credencial | Campo | Valor |
|---|---|---|
| **Telegram API** | Access Token | el token de BotFather |
| **Postgres** | Host | `localhost` (opción A) o `host.docker.internal` (opción B) |
| | Database / Port | `ecommerce_db` / `5432` |
| | User / Password | `bot_lector` / la contraseña del paso 2 |
| | SSL | Disable |

> Con la opción B, PostgreSQL debe aceptar conexiones desde Docker (`listen_addresses` y `pg_hba.conf`). Si no conecta, usa la opción A.

### 6. Importar y activar

1. **Workflows → Import from File** → `n8n/03-bot-telegram-consultas.json`.
2. En **Telegram Trigger** y en los tres nodos **Responder…**, selecciona tu credencial de Telegram.
3. En **Consultar pedido** y **Consultar stock**, selecciona la credencial Postgres de `bot_lector`.
4. Activa el flujo con el switch **Active**. En ese momento n8n registra el webhook en Telegram con tu URL de ngrok.

### 7. Probar

| Le escribes al bot | Responde |
|---|---|
| `/pedido 17` o `/pedido PED-000017` | Folio, estado, total y fecha |
| `/stock laptop` | Hasta 5 productos publicados con sus existencias y precio |
| cualquier otra cosa (`/start`, `hola`) | La lista de comandos |

**Si no responde:**
- En la terminal de ngrok deben aparecer peticiones `POST /webhook/...`. Si no llega nada, revisa que `NGROK_DOMAIN` esté en `backend/.env`, y luego desactiva y vuelve a activar el flujo.
- En n8n, **Executions** muestra en qué nodo falló.

### Seguridad del bot

- Las consultas usan **parámetros** (`$1`). El texto del usuario nunca se pega dentro del SQL, así que no hay inyección SQL.
- `bot_lector` no puede modificar nada, aunque alguien tome el control del flujo.
- Mientras la demo esté encendida, cualquiera con la URL ve la pantalla de acceso de n8n. **Apágala (Ctrl+C) al terminar.**
- Cualquiera que encuentre el bot puede consultar el estado de un pedido por su número. La consulta no devuelve datos personales, pero el bot es para demostración y no está pensado para clientes reales.

## Seguridad

- **Webhook:** el flujo descarta peticiones cuyo `X-Webhook-Secret` no coincide.
- **API key:**
  - Da acceso **solo de lectura** a `/api/reportes`.
  - Se compara en tiempo constante.
  - Si `REPORTES_API_KEY` está vacía o mide menos de 24 caracteres, esa vía queda deshabilitada.
- No subas `backend/.env` a GitHub. Los flujos exportados no contienen credenciales, porque n8n las guarda aparte.
