// =========================================================
// Pruebas del subsistema de notificaciones
//
//   npm test
//
// Demuestran que el núcleo (OrderService) depende solo del
// puerto EmailServicePort: aquí se conecta un adaptador falso
// en memoria, sin Nodemailer, sin SMTP y sin base de datos.
// =========================================================
const { test } = require("node:test");
const assert = require("node:assert/strict");

const OrderService = require("../src/application/orders/OrderService");
const EmailServicePort = require("../src/domain/ports/EmailServicePort");
const comprobanteClienteTemplate = require("../src/infrastructure/email/templates/comprobanteClienteTemplate");
const nuevoPedidoAdminTemplate = require("../src/infrastructure/email/templates/nuevoPedidoAdminTemplate");

// ---------- Dobles de prueba ----------
class EmailAdapterEnMemoria extends EmailServicePort {
  constructor() { super(); this.enviados = []; }
  async enviarComprobantePedido({ pedido, cliente }) {
    this.enviados.push({ tipo: "cliente", para: cliente.email, pedidoId: pedido.id });
    return { enviado: true, messageId: "fake-1" };
  }
  async notificarNuevoPedidoAdmin({ pedido }) {
    this.enviados.push({ tipo: "admin", para: "admin@test", pedidoId: pedido.id });
    return { enviado: true, messageId: "fake-2" };
  }
}

class EmailAdapterQueFalla extends EmailServicePort {
  async enviarComprobantePedido() { throw new Error("SMTP caído"); }
  async notificarNuevoPedidoAdmin() { throw new Error("SMTP caído"); }
}

const usuario = { id: 7, nombre: "Ana López", email: "ana@test.com", rol: "cliente" };
const producto = { id: 3, nombre: "Audífonos", precio: "450.50", stock: 10 };

function crearRepos() {
  const creados = [];
  return {
    creados,
    orderRepository: {
      async create(order) {
        creados.push(order);
        return {
          id: 42,
          usuario_id: order.usuarioId,
          fecha: "2026-10-08T15:00:00Z",
          total: String(order.total),
          estado: "PENDIENTE",
          detalles: order.detalles.map(d => ({
            producto_id: d.productoId,
            producto_nombre: producto.nombre,
            cantidad: d.cantidad,
            precio_unitario: String(d.precioUnitario)
          }))
        };
      }
    },
    userRepository: { async findById() { return usuario; } },
    productRepository: { async findById() { return producto; } }
  };
}

// ---------- Pruebas ----------
test("al crear un pedido se envía comprobante al cliente y aviso al admin", async () => {
  const r = crearRepos();
  const email = new EmailAdapterEnMemoria();
  const service = new OrderService(r.orderRepository, r.userRepository, r.productRepository, email);

  const pedido = await service.createOrder({
    usuarioId: 7,
    detalles: [{ productoId: 3, cantidad: 2 }]
  });

  assert.equal(pedido.estado, "PENDIENTE");
  assert.equal(Number(pedido.total), 901);
  assert.equal(email.enviados.length, 2);
  assert.deepEqual(email.enviados.map(e => e.tipo).sort(), ["admin", "cliente"]);
  assert.equal(email.enviados.find(e => e.tipo === "cliente").para, "ana@test.com");
  assert.equal(pedido.notificacion.cliente.enviado, true);
  assert.equal(pedido.notificacion.admin.enviado, true);
});

test("si el correo falla, el pedido se registra de todos modos", async () => {
  const r = crearRepos();
  const service = new OrderService(r.orderRepository, r.userRepository, r.productRepository, new EmailAdapterQueFalla());

  const original = console.error;
  console.error = () => {};
  const pedido = await service.createOrder({ usuarioId: 7, detalles: [{ productoId: 3, cantidad: 1 }] });
  console.error = original;

  assert.equal(r.creados.length, 1);
  assert.equal(pedido.id, 42);
  assert.equal(pedido.notificacion.cliente.enviado, false);
  assert.match(pedido.notificacion.cliente.motivo, /SMTP caído/);
});

test("sin adaptador de correo el pedido se crea sin notificar", async () => {
  const r = crearRepos();
  const service = new OrderService(r.orderRepository, r.userRepository, r.productRepository);
  const pedido = await service.createOrder({ usuarioId: 7, detalles: [{ productoId: 3, cantidad: 1 }] });
  assert.equal(pedido.notificacion.cliente.enviado, false);
});

test("un adaptador que no implementa el puerto lanza error", async () => {
  const puerto = new EmailServicePort();
  await assert.rejects(() => puerto.enviarComprobantePedido({}), /no implementado/);
});

test("la plantilla del cliente incluye folio, desglose, total y datos bancarios", () => {
  const { subject, html, text } = comprobanteClienteTemplate({
    pedido: {
      id: 42, fecha: "2026-10-08T15:00:00Z", total: "901.00",
      detalles: [{ producto_nombre: "Audífonos <b>", cantidad: 2, precio_unitario: "450.50" }]
    },
    cliente: { nombre: "Ana", email: "ana@test.com" },
    pago: { banco: "BBVA", titular: "Tienda", cuenta: "123", clabe: "012100001234567895", correoComprobantes: "pagos@t.test", plazoHoras: "48" },
    tienda: "Tienda 5M"
  });
  assert.match(subject, /PED-000042/);
  assert.match(subject, /Pendiente de pago/);
  assert.match(html, /012100001234567895/);
  assert.match(html, /\$901\.00/);
  assert.match(html, /Audífonos &lt;b&gt;/); // HTML escapado
  assert.match(text, /CLABE: 012100001234567895/);
});

test("la plantilla del administrador incluye cliente y total", () => {
  const { subject, html } = nuevoPedidoAdminTemplate({
    pedido: { id: 5, total: "100", detalles: [{ producto_nombre: "X", cantidad: 1, precio_unitario: "100" }] },
    cliente: { nombre: "Ana", email: "ana@test.com" },
    tienda: "Tienda 5M",
    urlPanel: "http://localhost:5173"
  });
  assert.match(subject, /Nuevo pedido PED-000005 de Ana/);
  assert.match(html, /ana@test\.com/);
});
