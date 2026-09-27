import { useEffect, useState } from "react";
import {
  createOrder,
  updateOrder
} from "../services/orderService";
import { getUsers } from "../services/userService";
import { getProducts } from "../services/productService";

function OrderForm({
  pedidoEditar,
  onOrderCreated,
  onOrderUpdated,
  onClose
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);

  const [usuarioId, setUsuarioId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [detalles, setDetalles] = useState([]);
  const [error, setError] = useState("");

  const modoEdicion = Boolean(pedidoEditar);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (pedidoEditar) {
      setUsuarioId(String(pedidoEditar.usuario_id));

      if (pedidoEditar.detalles?.length > 0) {
        setDetalles(
          pedidoEditar.detalles.map((detalle) => ({
            productoId: detalle.producto_id,
            productoNombre: detalle.producto_nombre,
            cantidad: Number(detalle.cantidad),
            precioUnitario: Number(detalle.precio_unitario)
          }))
        );
      }
    }
  }, [pedidoEditar]);

  async function cargarDatos() {
    try {
      const [usuariosData, productosData] =
        await Promise.all([
          getUsers(),
          getProducts()
        ]);

      setUsuarios(usuariosData);
      setProductos(productosData);
    } catch (error) {
      setError(error.message);
    }
  }

  function agregarProducto() {
    setError("");

    if (!productoId) {
      setError("Selecciona un producto.");
      return;
    }

    const cantidadNumero = Number(cantidad);

    if (
      !Number.isInteger(cantidadNumero) ||
      cantidadNumero <= 0
    ) {
      setError("La cantidad debe ser mayor que 0.");
      return;
    }

    const producto = productos.find(
      (item) => item.id === Number(productoId)
    );

    if (!producto) {
      setError("Producto no encontrado.");
      return;
    }

    const existente = detalles.find(
      (detalle) =>
        detalle.productoId === Number(productoId)
    );

    if (existente) {
      setError("Ese producto ya fue agregado al pedido.");
      return;
    }

    if (cantidadNumero > Number(producto.stock)) {
      setError(
        `Stock insuficiente. Disponible: ${producto.stock}`
      );
      return;
    }

    setDetalles([
      ...detalles,
      {
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: cantidadNumero,
        precioUnitario: Number(producto.precio)
      }
    ]);

    setProductoId("");
    setCantidad(1);
  }

  function eliminarDetalle(productoIdEliminar) {
    setDetalles(
      detalles.filter(
        (detalle) =>
          detalle.productoId !== productoIdEliminar
      )
    );
  }

  async function manejarEnvio(event) {
    event.preventDefault();
    setError("");

    if (!usuarioId) {
      setError("Selecciona un cliente.");
      return;
    }

    if (detalles.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }

    try {
      const pedido = {
        usuarioId: Number(usuarioId),
        detalles: detalles.map((detalle) => ({
          productoId: detalle.productoId,
          cantidad: detalle.cantidad
        }))
      };

      if (modoEdicion) {
        await updateOrder(pedidoEditar.id, pedido);

        if (onOrderUpdated) {
          onOrderUpdated();
        }
      } else {
        await createOrder(pedido);

        if (onOrderCreated) {
          onOrderCreated();
        }
      }

      onClose();

    } catch (error) {
      setError(error.message);
    }
  }

  const total = detalles.reduce(
    (suma, detalle) =>
      suma +
      Number(detalle.precioUnitario) *
        Number(detalle.cantidad),
    0
  );

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-container order-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <h3>
              {modoEdicion
                ? "Editar pedido"
                : "Nuevo pedido"}
            </h3>

            <p>
              {modoEdicion
                ? "Actualiza los productos del pedido"
                : "Registra una nueva venta"}
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

        <form onSubmit={manejarEnvio}>
          <div className="form-group">
            <label>Cliente</label>

            <select
              value={usuarioId}
              onChange={(event) =>
                setUsuarioId(event.target.value)
              }
              required
            >
              <option value="">
                Selecciona un cliente
              </option>

              {usuarios.map((usuario) => (
                <option
                  key={usuario.id}
                  value={usuario.id}
                >
                  {usuario.nombre} — {usuario.email}
                </option>
              ))}
            </select>
          </div>

          <div className="order-product-selector">
            <div className="form-group">
              <label>Producto</label>

              <select
                value={productoId}
                onChange={(event) =>
                  setProductoId(event.target.value)
                }
              >
                <option value="">
                  Selecciona un producto
                </option>

                {productos.map((producto) => (
                  <option
                    key={producto.id}
                    value={producto.id}
                    disabled={Number(producto.stock) === 0}
                  >
                    {producto.nombre} — $
                    {Number(producto.precio).toLocaleString(
                      "es-MX",
                      {
                        minimumFractionDigits: 2
                      }
                    )}{" "}
                    — Stock: {producto.stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group quantity-group">
              <label>Cantidad</label>

              <input
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(event) =>
                  setCantidad(event.target.value)
                }
              />
            </div>

            <button
              type="button"
              className="btn-secondary add-product-button"
              onClick={agregarProducto}
            >
              + Agregar
            </button>
          </div>

          <div className="order-details">
            <div className="card-header">
              <h4>Productos del pedido</h4>

              <span>
                {detalles.length} producto(s)
              </span>
            </div>

            {detalles.length === 0 ? (
              <div className="order-empty">
                <p>
                  Aún no hay productos agregados.
                </p>
              </div>
            ) : (
              <div className="order-items">
                {detalles.map((detalle) => (
                  <div
                    className="order-item"
                    key={detalle.productoId}
                  >
                    <div className="order-item-info">
                      <strong>
                        {detalle.productoNombre}
                      </strong>

                      <span>
                        {detalle.cantidad} × $
                        {Number(
                          detalle.precioUnitario
                        ).toLocaleString(
                          "es-MX",
                          {
                            minimumFractionDigits: 2
                          }
                        )}
                      </span>
                    </div>

                    <div className="order-item-right">
                      <strong>
                        $
                        {(
                          Number(
                            detalle.precioUnitario
                          ) *
                          Number(detalle.cantidad)
                        ).toLocaleString(
                          "es-MX",
                          {
                            minimumFractionDigits: 2
                          }
                        )}
                      </strong>

                      <button
                        type="button"
                        className="remove-item-button"
                        onClick={() =>
                          eliminarDetalle(
                            detalle.productoId
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="order-total">
            <span>Total del pedido</span>

            <strong>
              $
              {total.toLocaleString("es-MX", {
                minimumFractionDigits: 2
              })}
            </strong>
          </div>

          {error && (
            <p className="mensaje-error">
              {error}
            </p>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              {modoEdicion
                ? "Guardar cambios"
                : "Crear pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderForm;
