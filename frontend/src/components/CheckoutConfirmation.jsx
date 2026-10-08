// =========================================================
// Confirmación del checkout
//
// Se muestra después de generar el pedido. Indica que quedó
// "Pendiente de pago", resume la compra y confirma si se
// envió el correo con las instrucciones de pago.
// En desarrollo (Ethereal) muestra el enlace de vista previa.
// =========================================================

function folio(id) {
  return `PED-${String(id).padStart(6, "0")}`;
}

function CheckoutConfirmation({
  pedido,
  formatearPrecio,
  onVerPedidos,
  onSeguirComprando
}) {

  const notifCliente =
    pedido.notificacion?.cliente;

  const notifAdmin =
    pedido.notificacion?.admin;

  const correoEnviado =
    notifCliente?.enviado === true;

  const correoDestino =
    pedido.usuario_email ||
    pedido.emailCliente ||
    "tu correo";

  const enDesarrollo =
    import.meta.env.DEV;

  return (

    <div className="checkout-confirmation">

      <div className="checkout-confirmation-header">

        <div className="checkout-confirmation-icon">
          ✓
        </div>

        <div>

          <span className="client-eyebrow">
            PEDIDO GENERADO
          </span>

          <h2>
            Folio {folio(pedido.id)}
          </h2>

          <span className="checkout-status-badge">
            Pendiente de pago
          </span>

        </div>

      </div>

      <div
        className={`client-message ${
          correoEnviado ? "success" : "error"
        }`}
      >
        {correoEnviado
          ? `Te enviamos el comprobante y las instrucciones de pago a ${correoDestino}.`
          : "Tu pedido se registró, pero no pudimos enviar el correo. Consulta los datos de pago con el administrador."}
      </div>

      <div className="checkout-confirmation-body">

        <table className="checkout-confirmation-table">

          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {(pedido.detalles || []).map(d => (
              <tr key={d.id || d.producto_id}>
                <td>{d.producto_nombre}</td>
                <td>{d.cantidad}</td>
                <td>
                  $
                  {formatearPrecio(
                    Number(d.precio_unitario) *
                    Number(d.cantidad)
                  )}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={2}>Total a pagar</td>
              <td>
                ${formatearPrecio(pedido.total)}
              </td>
            </tr>
          </tfoot>

        </table>

        <div className="checkout-next-steps">

          <h3>
            ¿Qué sigue?
          </h3>

          <ol>
            <li>Revisa tu bandeja de entrada.</li>
            <li>
              Transfiere el monto exacto usando
              el folio <strong>{folio(pedido.id)}</strong> como referencia.
            </li>
            <li>Envía tu comprobante de pago.</li>
            <li>
              El administrador validará el pago
              y aceptará tu pedido.
            </li>
          </ol>

        </div>

      </div>

      {enDesarrollo &&
        (notifCliente?.previewUrl || notifAdmin?.previewUrl) && (

        <div className="checkout-dev-preview">

          <strong>
            Modo pruebas (Ethereal)
          </strong>

          {notifCliente?.previewUrl && (
            <a
              href={notifCliente.previewUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver correo del cliente
            </a>
          )}

          {notifAdmin?.previewUrl && (
            <a
              href={notifAdmin.previewUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver correo del administrador
            </a>
          )}

        </div>

      )}

      <div className="checkout-confirmation-actions">

        <button
          className="client-primary-button"
          onClick={onVerPedidos}
        >
          Ver mis pedidos
        </button>

        <button
          className="client-secondary-button"
          onClick={onSeguirComprando}
        >
          Seguir comprando
        </button>

      </div>

    </div>
  );
}

export default CheckoutConfirmation;
