// =========================================================
// Pruebas de la integración con n8n
//
//   npm test
//
// - N8nWebhookAdapter publica el pedido en el webhook (fetch simulado)
// - EmailServiceConRespaldo usa Nodemailer si n8n falla
// - La fábrica elige el adaptador según EMAIL_PROVIDER
// - La API key de reportes se valida correctamente
// =========================================================
const { test } = require("node:test");
const assert = require("node:assert/strict");

const EmailServicePort = require("../src/domain/ports/EmailServicePort");
const OrderService = require("../src/application/orders/OrderService");
const N8nWebhookAdapter = require("../src/infrastructure/notifications/N8nWebhookAdapter");
const EmailServiceConRespaldo = require("../src/infrastructure/notifications/EmailServiceConRespaldo");

const CONFIG = {
  webhookUrl: "http://localhost:5678/webhook/pedido-creado",
  secreto: "secreto-de-prueba",
  timeoutMs: 200,
  tienda: "Tienda 5M",
  adminEmail: "admin@tienda5m.test",
  urlPanel: "http://localhost:5173",
  pago: { banco: "BBVA", titular: "Tienda", cuenta: "123", clabe: "012100001234567895", correoComprobantes: "pagos@t.test", plazoHoras: "48" }
};

const PEDIDO = {
  id: 17,
  fecha: "2026-10-08T16:28:00Z",
  total: "21099.00",
  estado: "PENDIENTE",
  detalles: [
    { producto_id: 1, producto_nombre: "Laptop Lenovo IdeaPad", cantidad: 1, precio_unitario: "16500.00" },
    { producto_id: 2, producto_nombre: "Mouse LogiTech", cantidad: 1, precio_unitario: "1800.00" },
    { producto_id: 3, producto_nombre: "Logitech C920s PRO HD", cantidad: 1, precio_unitario: "2799.00" }
  ]
};

const CLIENTE = { id: 12, nombre: "cliente", email: "cliente@gmail.com" };

function fetchSimulado(respuesta = { ok: true, status: 200 }) {
  const llamadas = [];
  const fn = async (url, opciones) => {
    llamadas.push({ url, opciones, cuerpo: JSON.parse(opciones.body) });
    return respuesta;
  };
  fn.llamadas = llamadas;
  return fn;
}

// ---------------------------------------------------------
// N8nWebhookAdapter
// ---------------------------------------------------------
test("es una implementación del puerto EmailServicePort", () => {
  assert.ok(new N8nWebhookAdapter(CONFIG, fetchSimulado()) instanceof EmailServicePort);
});

test("exige la URL del webhook", () => {
  assert.throws(() => new N8nWebhookAdapter({ ...CONFIG, webhookUrl: "" }), /N8N_WEBHOOK_URL/);
});

test("publica el comprobante del cliente con datos, correo armado y secreto", async () => {
  const fetch = fetchSimulado();
  const adapter = new N8nWebhookAdapter(CONFIG, fetch);

  const r = await adapter.enviarComprobantePedido({ pedido: PEDIDO, cliente: CLIENTE });

  assert.deepEqual(r, { enviado: true, via: "n8n", estadoHttp: 200 });
  const { url, opciones, cuerpo } = fetch.llamadas[0];
  assert.equal(url, CONFIG.webhookUrl);
  assert.equal(opciones.method, "POST");
  assert.equal(opciones.headers["X-Webhook-Secret"], "secreto-de-prueba");
  assert.equal(cuerpo.evento, "pedido.creado");
  assert.equal(cuerpo.destinatario, "cliente");
  assert.equal(cuerpo.para, "cliente@gmail.com");
  assert.equal(cuerpo.pedido.folio, "PED-000017");
  assert.equal(cuerpo.pedido.total, 21099);
  assert.equal(cuerpo.pedido.detalles[0].producto, "Laptop Lenovo IdeaPad");
  assert.equal(cuerpo.pedido.detalles[0].subtotal, 16500);
  assert.equal(cuerpo.pago.referencia, "PED-000017");
  assert.match(cuerpo.correo.subject, /PED-000017/);
  assert.match(cuerpo.correo.html, /012100001234567895/);
});

test("publica el aviso al administrador", async () => {
  const fetch = fetchSimulado();
  await new N8nWebhookAdapter(CONFIG, fetch).notificarNuevoPedidoAdmin({ pedido: PEDIDO, cliente: CLIENTE });

  const { cuerpo } = fetch.llamadas[0];
  assert.equal(cuerpo.destinatario, "admin");
  assert.equal(cuerpo.para, "admin@tienda5m.test");
  assert.equal(cuerpo.urlPanel, "http://localhost:5173");
  assert.match(cuerpo.correo.subject, /Nuevo pedido PED-000017/);
});

test("sin secreto configurado no envía el header", async () => {
  const fetch = fetchSimulado();
  await new N8nWebhookAdapter({ ...CONFIG, secreto: "" }, fetch).notificarNuevoPedidoAdmin({ pedido: PEDIDO, cliente: CLIENTE });
  assert.equal(fetch.llamadas[0].opciones.headers["X-Webhook-Secret"], undefined);
});

test("una respuesta HTTP de error se reporta como fallo", async () => {
  const adapter = new N8nWebhookAdapter(CONFIG, fetchSimulado({ ok: false, status: 404, statusText: "Not Found" }));
  await assert.rejects(() => adapter.enviarComprobantePedido({ pedido: PEDIDO, cliente: CLIENTE }), /404/);
});

test("si n8n no responde a tiempo se cancela la petición", async () => {
  const lento = (url, { signal }) => new Promise((_, reject) => {
    signal.addEventListener("abort", () => {
      const e = new Error("aborted");
      e.name = "AbortError";
      reject(e);
    });
  });
  const adapter = new N8nWebhookAdapter({ ...CONFIG, timeoutMs: 30 }, lento);
  await assert.rejects(() => adapter.enviarComprobantePedido({ pedido: PEDIDO, cliente: CLIENTE }), /no respondió en 30 ms/);
});

// ---------------------------------------------------------
// Respaldo
// ---------------------------------------------------------
class AdaptadorFalso extends EmailServicePort {
  constructor(falla) { super(); this.falla = falla; this.llamadas = 0; }
  async enviarComprobantePedido() { this.llamadas++; if (this.falla) throw new Error("n8n apagado"); return { enviado: true, via: "principal" }; }
  async notificarNuevoPedidoAdmin() { this.llamadas++; if (this.falla) throw new Error("n8n apagado"); return { enviado: true, via: "principal" }; }
}

const silencioso = { warn() {} };

test("con n8n disponible no se usa el respaldo", async () => {
  const principal = new AdaptadorFalso(false);
  const respaldo = new AdaptadorFalso(false);
  const r = await new EmailServiceConRespaldo(principal, respaldo, silencioso).enviarComprobantePedido({});
  assert.equal(r.via, "principal");
  assert.equal(respaldo.llamadas, 0);
});

test("si n8n falla, se envía por el respaldo e indica el motivo", async () => {
  const respaldo = new AdaptadorFalso(false);
  const r = await new EmailServiceConRespaldo(new AdaptadorFalso(true), respaldo, silencioso).notificarNuevoPedidoAdmin({});
  assert.equal(r.enviado, true);
  assert.equal(r.respaldo, true);
  assert.equal(r.motivoRespaldo, "n8n apagado");
  assert.equal(respaldo.llamadas, 1);
});

test("OrderService crea el pedido y notifica vía n8n sin cambios en el núcleo", async () => {
  const fetch = fetchSimulado();
  const service = new OrderService(
    { async create(o) { return { ...PEDIDO, total: String(o.total) }; } },
    { async findById() { return { ...CLIENTE, rol: "cliente" }; } },
    { async findById() { return { id: 1, nombre: "Laptop Lenovo IdeaPad", precio: "16500.00", stock: 5 }; } },
    new N8nWebhookAdapter(CONFIG, fetch)
  );

  const pedido = await service.createOrder({ usuarioId: 12, detalles: [{ productoId: 1, cantidad: 1 }] });

  assert.equal(pedido.notificacion.cliente.via, "n8n");
  assert.equal(pedido.notificacion.admin.via, "n8n");
  assert.deepEqual(fetch.llamadas.map(l => l.cuerpo.destinatario).sort(), ["admin", "cliente"]);
});

// ---------------------------------------------------------
// Fábrica de notificaciones
// ---------------------------------------------------------
test("la fábrica elige el adaptador según EMAIL_PROVIDER", () => {
  const crear = require("../src/infrastructure/notifications/crearServicioNotificaciones");
  const NodemailerAdapter = require("../src/infrastructure/email/NodemailerAdapter");

  assert.equal(crear({ EMAIL_PROVIDER: "none" }), null);
  assert.ok(crear({ EMAIL_PROVIDER: "ethereal" }) instanceof NodemailerAdapter);

  const conRespaldo = crear({ EMAIL_PROVIDER: "n8n", N8N_WEBHOOK_URL: CONFIG.webhookUrl });
  assert.ok(conRespaldo instanceof EmailServiceConRespaldo);
  assert.ok(conRespaldo.principal instanceof N8nWebhookAdapter);
  assert.ok(conRespaldo.respaldo instanceof NodemailerAdapter);

  const soloN8n = crear({ EMAIL_PROVIDER: "n8n", N8N_WEBHOOK_URL: CONFIG.webhookUrl, N8N_RESPALDO: "none" });
  assert.ok(soloN8n instanceof N8nWebhookAdapter);
});

// ---------------------------------------------------------
// API key de reportes
// ---------------------------------------------------------
function ejecutarMiddleware(headers, env) {
  const { verificarTokenOApiKey } = require("../src/interfaces/middleware/apiKeyMiddleware");
  const anterior = process.env.REPORTES_API_KEY;
  if (env === undefined) delete process.env.REPORTES_API_KEY; else process.env.REPORTES_API_KEY = env;

  const req = { headers };
  const res = {
    codigo: 200,
    cuerpo: null,
    status(c) { this.codigo = c; return this; },
    json(b) { this.cuerpo = b; return this; }
  };
  let siguio = false;
  verificarTokenOApiKey(req, res, () => { siguio = true; });

  if (anterior === undefined) delete process.env.REPORTES_API_KEY; else process.env.REPORTES_API_KEY = anterior;
  return { req, res, siguio };
}

const CLAVE = "clave-de-prueba-suficientemente-larga-123";

test("la API key correcta da acceso de admin a reportes", () => {
  const { req, siguio } = ejecutarMiddleware({ "x-api-key": CLAVE }, CLAVE);
  assert.equal(siguio, true);
  assert.equal(req.usuario.rol, "admin");
  assert.equal(req.usuario.servicio, true);
});

test("una API key incorrecta responde 401", () => {
  const { res, siguio } = ejecutarMiddleware({ "x-api-key": "otra-clave-cualquiera-xxxxxxxxx" }, CLAVE);
  assert.equal(siguio, false);
  assert.equal(res.codigo, 401);
});

test("si REPORTES_API_KEY no está configurada, la vía por API key queda desactivada", () => {
  const { res, siguio } = ejecutarMiddleware({ "x-api-key": CLAVE }, undefined);
  assert.equal(siguio, false);
  assert.match(res.cuerpo.mensaje, /no está habilitado/);
});

test("sin header X-API-Key se exige el JWT como siempre", () => {
  const { res, siguio } = ejecutarMiddleware({}, CLAVE);
  assert.equal(siguio, false);
  assert.equal(res.codigo, 401);
  assert.equal(res.cuerpo.mensaje, "Token requerido");
});
