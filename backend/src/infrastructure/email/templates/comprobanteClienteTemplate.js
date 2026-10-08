// =========================================================
// PLANTILLA: Comprobante de compra + instrucciones de pago
// Destinatario: CLIENTE
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

function comprobanteClienteTemplate({ pedido, cliente, pago, tienda }) {

  const folio = folioPedido(pedido.id);
  const detalles = normalizarDetalles(pedido.detalles);
  const total = formatearMoneda(pedido.total);
  const fecha = formatearFecha(pedido.fecha);

  const subject = `Comprobante de pedido ${folio} – Pendiente de pago`;

  const contenido = `
          <p style="margin:0 0 12px;">Hola <strong>${escaparHtml(cliente.nombre)}</strong>,</p>
          <p style="margin:0 0 18px;line-height:1.5;">
            Recibimos tu pedido correctamente. Tu pedido quedó registrado con estado
            <span style="display:inline-block;background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:999px;font-weight:600;font-size:13px;">Pendiente de pago</span>.
            Para completar tu compra realiza el pago con los datos de abajo.
          </p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;font-size:14px;">
            <tr>
              <td style="color:#6b7280;padding:4px 0;">Folio</td>
              <td style="text-align:right;font-weight:700;">${folio}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;padding:4px 0;">Fecha</td>
              <td style="text-align:right;">${escaparHtml(fecha)}</td>
            </tr>
          </table>

          <h3 style="font-size:15px;margin:0 0 8px;">Desglose de tu compra</h3>
          ${tablaDetallesHtml(detalles)}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
            <tr>
              <td style="padding:10px 12px;font-weight:700;">Total a pagar</td>
              <td style="padding:10px 12px;text-align:right;font-size:20px;font-weight:700;color:#1e3a8a;">${total}</td>
            </tr>
          </table>

          <div style="margin-top:20px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:16px 18px;">
            <h3 style="font-size:15px;margin:0 0 10px;color:#1e3a8a;">Instrucciones de pago (transferencia o depósito)</h3>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
              <tr><td style="color:#6b7280;padding:3px 0;">Banco</td><td style="text-align:right;font-weight:600;">${escaparHtml(pago.banco)}</td></tr>
              <tr><td style="color:#6b7280;padding:3px 0;">Titular</td><td style="text-align:right;font-weight:600;">${escaparHtml(pago.titular)}</td></tr>
              <tr><td style="color:#6b7280;padding:3px 0;">Cuenta</td><td style="text-align:right;font-weight:600;">${escaparHtml(pago.cuenta)}</td></tr>
              <tr><td style="color:#6b7280;padding:3px 0;">CLABE</td><td style="text-align:right;font-weight:600;">${escaparHtml(pago.clabe)}</td></tr>
              <tr><td style="color:#6b7280;padding:3px 0;">Referencia / concepto</td><td style="text-align:right;font-weight:700;">${folio}</td></tr>
              <tr><td style="color:#6b7280;padding:3px 0;">Monto exacto</td><td style="text-align:right;font-weight:700;">${total}</td></tr>
            </table>
            <ol style="margin:12px 0 0;padding-left:18px;font-size:13px;line-height:1.6;color:#1f2937;">
              <li>Realiza la transferencia o depósito por el monto exacto.</li>
              <li>Usa el folio <strong>${folio}</strong> como referencia o concepto.</li>
              <li>Envía tu comprobante a <strong>${escaparHtml(pago.correoComprobantes)}</strong> dentro de las próximas ${escaparHtml(pago.plazoHoras)} horas.</li>
              <li>Al validar el pago, tu pedido cambiará a <strong>Aceptado</strong> y se preparará el envío.</li>
            </ol>
          </div>

          <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
            Si no se recibe el pago dentro del plazo indicado, el pedido podrá ser cancelado.
          </p>`;

  const html = envolverLayout({
    titulo: `Pedido ${folio} recibido`,
    contenido,
    tienda
  });

  const text = [
    `Hola ${cliente.nombre},`,
    "",
    `Recibimos tu pedido ${folio} (${fecha}). Estado: Pendiente de pago.`,
    "",
    "Desglose:",
    tablaDetallesTexto(detalles),
    `Total a pagar: ${total}`,
    "",
    "Instrucciones de pago (transferencia o depósito):",
    `  Banco: ${pago.banco}`,
    `  Titular: ${pago.titular}`,
    `  Cuenta: ${pago.cuenta}`,
    `  CLABE: ${pago.clabe}`,
    `  Referencia: ${folio}`,
    `  Monto: ${total}`,
    "",
    `Envía tu comprobante a ${pago.correoComprobantes} dentro de ${pago.plazoHoras} horas.`,
    "",
    `— ${tienda}`
  ].join("\n");

  return { subject, html, text };
}

module.exports = comprobanteClienteTemplate;
