import { useEffect, useState } from "react";
import { getOrderById } from "../services/orderService";

function OrderDetail({ pedido, onClose }) {
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPedido();
  }, [pedido]);

  async function cargarPedido() {
    try {
      const data = await getOrderById(pedido.id);

      setDetalle(data);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  if (!detalle && !error) {
    return (
      <div
        className="modal-overlay"
        onClick={onClose}
      >
        <div
          className="modal-container order-detail-modal"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="modal-header">
            <div>
              <h3>Cargando pedido...</h3>
              <p>
                Obteniendo información del pedido.
              </p>
            </div>

            <button
              className="modal-close"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-container order-detail-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span className="order-detail-label">
              DETALLE DEL PEDIDO
            </span>

            <h3>
              Pedido #{detalle.id}
            </h3>

            <p>
              Información completa de la venta.
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {error ? (
          <p className="mensaje-error">
            {error}
          </p>
        ) : (
          <>
            <div className="order-detail-info">

              <div className="order-info-card">
                <span>Cliente</span>

                <strong>
                  {detalle.usuario_nombre}
                </strong>

                <small>
                  {detalle.usuario_email}
                </small>
              </div>

              <div className="order-info-card">
                <span>Fecha</span>

                <strong>
                  {new Date(
                    detalle.fecha
                  ).toLocaleDateString(
                    "es-MX",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    }
                  )}
                </strong>

                <small>
                  {new Date(
                    detalle.fecha
                  ).toLocaleTimeString(
                    "es-MX",
                    {
                      hour: "2-digit",
                      minute: "2-digit"
                    }
                  )}
                </small>
              </div>

              <div className="order-info-card">
                <span>Productos</span>

                <strong>
                  {detalle.detalles.length}
                </strong>

                <small>
                  producto(s) diferentes
                </small>
              </div>

            </div>

            <div className="order-detail-section">

              <div className="card-header">
                <h4>
                  Productos del pedido
                </h4>

                <span>
                  {detalle.detalles.length} artículo(s)
                </span>
              </div>

              <div className="order-detail-table">

                <div className="order-detail-table-header">
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Precio</span>
                  <span>Subtotal</span>
                </div>

                {detalle.detalles.map(
                  (producto) => {

                    const subtotal =
                      Number(
                        producto.precio_unitario
                      ) *
                      Number(
                        producto.cantidad
                      );

                    return (
                      <div
                        className="order-detail-row"
                        key={producto.id}
                      >
                        <div className="order-product-name">
                          <div className="product-avatar">
                            {producto.producto_nombre
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>
                            {producto.producto_nombre}
                          </strong>
                        </div>

                        <span>
                          {producto.cantidad}
                        </span>

                        <span>
                          $
                          {Number(
                            producto.precio_unitario
                          ).toLocaleString(
                            "es-MX",
                            {
                              minimumFractionDigits: 2
                            }
                          )}
                        </span>

                        <strong>
                          $
                          {subtotal.toLocaleString(
                            "es-MX",
                            {
                              minimumFractionDigits: 2
                            }
                          )}
                        </strong>
                      </div>
                    );
                  }
                )}

              </div>
            </div>

            <div className="order-detail-total">
              <span>
                Total del pedido
              </span>

              <strong>
                $
                {Number(
                  detalle.total
                ).toLocaleString(
                  "es-MX",
                  {
                    minimumFractionDigits: 2
                  }
                )}
              </strong>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OrderDetail;
