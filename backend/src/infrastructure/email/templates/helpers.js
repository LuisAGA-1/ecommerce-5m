// =========================================================
// Utilidades compartidas por las plantillas de correo
// =========================================================

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatearMoneda(valor) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
  });
}

function formatearFecha(fecha) {
  const f = fecha ? new Date(fecha) : new Date();
  return f.toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City"
  });
}

function folioPedido(id) {
  return `PED-${String(id).padStart(6, "0")}`;
}

// Normaliza los detalles que llegan desde el repositorio
// (snake_case de PostgreSQL) o desde la entidad (camelCase).
function normalizarDetalles(detalles = []) {
  return detalles.map(d => {
    const cantidad = Number(d.cantidad);
    const precio = Number(d.precio_unitario ?? d.precioUnitario);
    return {
      nombre: d.producto_nombre ?? d.productoNombre ?? `Producto #${d.producto_id ?? d.productoId}`,
      cantidad,
      precio,
      subtotal: cantidad * precio
    };
  });
}

function tablaDetallesHtml(detalles) {
  const filas = detalles.map(d => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escaparHtml(d.nombre)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${d.cantidad}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatearMoneda(d.precio)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatearMoneda(d.subtotal)}</td>
          </tr>`).join("");

  return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f3f4f6;color:#374151;">
              <th style="padding:10px 12px;text-align:left;">Producto</th>
              <th style="padding:10px 12px;text-align:center;">Cant.</th>
              <th style="padding:10px 12px;text-align:right;">Precio</th>
              <th style="padding:10px 12px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${filas}
          </tbody>
        </table>`;
}

function tablaDetallesTexto(detalles) {
  return detalles
    .map(d => `  - ${d.nombre} x${d.cantidad} @ ${formatearMoneda(d.precio)} = ${formatearMoneda(d.subtotal)}`)
    .join("\n");
}

function envolverLayout({ titulo, contenido, tienda }) {
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>${escaparHtml(titulo)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background:#1e3a8a;color:#ffffff;padding:22px 28px;">
            <div style="font-size:12px;letter-spacing:2px;opacity:.8;">${escaparHtml(tienda.toUpperCase())}</div>
            <div style="font-size:20px;font-weight:700;margin-top:4px;">${escaparHtml(titulo)}</div>
          </td>
        </tr>
        <tr><td style="padding:24px 28px;">${contenido}
        </td></tr>
        <tr>
          <td style="background:#f9fafb;color:#6b7280;font-size:12px;padding:16px 28px;border-top:1px solid #e5e7eb;">
            Este es un correo automático generado por ${escaparHtml(tienda)}. No respondas a este mensaje.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = {
  escaparHtml,
  formatearMoneda,
  formatearFecha,
  folioPedido,
  normalizarDetalles,
  tablaDetallesHtml,
  tablaDetallesTexto,
  envolverLayout
};
