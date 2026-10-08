// =========================================================
// Prueba rápida del adaptador de correo (sin base de datos)
//
//   npm run email:prueba
//
// Envía el comprobante al cliente y el aviso al administrador
// usando un pedido de ejemplo. Con EMAIL_PROVIDER=ethereal
// imprime las URL de vista previa; con mailtrap, revisa tu
// bandeja de pruebas en https://mailtrap.io
// =========================================================
require("dotenv").config({ path: __dirname + "/../../.env" });

const NodemailerAdapter = require("../src/infrastructure/email/NodemailerAdapter");

const pedidoEjemplo = {
  id: 1,
  fecha: new Date().toISOString(),
  total: "1749.00",
  estado: "PENDIENTE",
  detalles: [
    { producto_id: 1, producto_nombre: "Teclado mecánico", cantidad: 1, precio_unitario: "1199.00" },
    { producto_id: 2, producto_nombre: "Mouse inalámbrico", cantidad: 2, precio_unitario: "275.00" }
  ]
};

const clienteEjemplo = {
  id: 10,
  nombre: "Cliente de Prueba",
  email: process.env.TEST_CLIENT_EMAIL || "cliente@tienda5m.test"
};

(async () => {
  const adapter = new NodemailerAdapter(
    NodemailerAdapter.configDesdeEntorno()
  );

  const cliente = await adapter.enviarComprobantePedido({
    pedido: pedidoEjemplo,
    cliente: clienteEjemplo
  });

  const admin = await adapter.notificarNuevoPedidoAdmin({
    pedido: pedidoEjemplo,
    cliente: clienteEjemplo
  });

  console.log("\nResultado:", { cliente, admin });
})().catch(error => {
  console.error("Error al enviar el correo de prueba:", error.message);
  process.exit(1);
});
