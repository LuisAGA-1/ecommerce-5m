// =========================================================
// PLANTILLA: Aviso de nuevo pedido
// Destinatario: ADMINISTRADOR
// =========================================================
const {
  escaparHtml,
  formatearMoneda,
  formatearFecha,
  folioPedido,
  normalizarDetalles,
  tablaDetallesHtml,
  tablaDetallesTexto,
  envolverLayout
} = require("./helpers");

function nuevoPedidoAdminTemplate({ pedido, cliente, tienda, urlPanel }) {

  const folio = folioPedido(pedido.id);
  const detalles = normalizarDetalles(pedido.detalles);
  const total = formatearMoneda(pedido.total);
  const fecha = formatearFecha(pedido.fecha);
  const unidades = detalles.reduce((s, d) => s + d.cantidad, 0);

  const subject = `Nuevo pedido ${folio} de ${cliente.nombre} – ${total}`;

  const contenido = `
          <p style="margin:0 0 16px;line-height:1.5;">
            Se registró un nuevo pedido en la tienda. Está <strong>pendiente de pago</strong>;
            acéptalo desde el panel cuando el cliente envíe su comprobante.
          </p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;font-size:14px;">
            <tr><td style="color:#6b7280;padding:4px 0;">Folio</td><td style="text-align:right;font-weight:700;">${folio}</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0;">Fecha</td><td style="text-align:right;">${escaparHtml(fecha)}</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0;">Cliente</td><td style="text-align:right;">${escaparHtml(cliente.nombre)}</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0;">Correo del cliente</td><td style="text-align:right;">${escaparHtml(cliente.email)}</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0;">Unidades</td><td style="text-align:right;">${unidades}</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0;">Total</td><td style="text-align:right;font-weight:700;color:#1e3a8a;">${total}</td></tr>
          </table>

          ${tablaDetallesHtml(detalles)}

          <p style="margin:22px 0 0;">
            <a href="${escaparHtml(urlPanel)}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">
              Abrir panel de pedidos
            </a>
          </p>`;

  const html = envolverLayout({
    titulo: `Nuevo pedido ${folio}`,
    contenido,
    tienda
  });

  const text = [
    `Nuevo pedido ${folio} (${fecha}) – Pendiente de pago`,
    `Cliente: ${cliente.nombre} <${cliente.email}>`,
    "",
    tablaDetallesTexto(detalles),
    `Total: ${total}`,
    "",
    `Panel: ${urlPanel}`
  ].join("\n");

  return { subject, html, text };
}

module.exports = nuevoPedidoAdminTemplate;
