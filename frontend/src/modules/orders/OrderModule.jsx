import { useEffect, useState } from "react";
import OrderDetail from "../../components/OrderDetail";
import {
  getOrders,
  deleteOrder,
  acceptOrder,
  rejectOrder
} from "../../services/orderService";

function OrderModule() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [mostrarDetalle, setMostrarDetalle] =
    useState(false);

  const [pedidoDetalle, setPedidoDetalle] =
    useState(null);

  const [busqueda, setBusqueda] =
    useState("");

  async function cargarPedidos() {
    try {
      const data = await getOrders();

      setPedidos(data);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    cargarPedidos();
  }, []);

  function abrirDetallePedido(pedido) {
    setPedidoDetalle(pedido);
    setMostrarDetalle(true);
    setMensaje("");
    setError("");
  }

  function cerrarDetalle() {
    setMostrarDetalle(false);
    setPedidoDetalle(null);
  }

  async function aceptarPedido(pedido) {
    const confirmar = window.confirm(
      `¿Confirmar la aceptación del pedido #${pedido.id}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await acceptOrder(pedido.id);

      setMensaje(
        `Pedido #${pedido.id} aceptado correctamente.`
      );

      setError("");

      await cargarPedidos();
    } catch (error) {
      setError(error.message);
      setMensaje("");
    }
  }

  async function rechazarPedido(pedido) {
    const confirmar = window.confirm(
      `¿Confirmar el rechazo del pedido #${pedido.id}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await rejectOrder(pedido.id);

      setMensaje(
        `Pedido #${pedido.id} rechazado correctamente.`
      );

      setError("");

      await cargarPedidos();
    } catch (error) {
      setError(error.message);
      setMensaje("");
    }
  }

  async function eliminarPedido(pedido) {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el pedido #${pedido.id}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await deleteOrder(pedido.id);

      setMensaje(
        "Pedido eliminado correctamente"
      );

      setError("");

      await cargarPedidos();
    } catch (error) {
      setError(error.message);
      setMensaje("");
    }
  }

  const pedidosFiltrados = pedidos.filter(
    (pedido) => {
      const texto = busqueda.toLowerCase();

      return (
        String(pedido.id)
          .toLowerCase()
          .includes(texto) ||
        (pedido.usuario_nombre || "")
          .toLowerCase()
          .includes(texto) ||
        (pedido.usuario_email || "")
          .toLowerCase()
          .includes(texto)
      );
    }
  );

  return (
    <div className="products-page">

      <div className="page-header">

        <div>
          <h2>Pedidos</h2>

          <p>
            Administra las ventas y pedidos realizados.
          </p>
        </div>

      </div>

      {mensaje && (
        <p className="mensaje-exito">
          {mensaje}
        </p>
      )}

      {error && (
        <p className="mensaje-error">
          {error}
        </p>
      )}

      <div className="products-toolbar">

        <div className="search-box">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Buscar por pedido o cliente..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
          />

        </div>

        <div className="products-count">
          {pedidosFiltrados.length} pedidos
        </div>

      </div>

      {pedidosFiltrados.length === 0 ? (

        <div className="empty-state">

          <h3>
            No se encontraron pedidos
          </h3>

          <p>
            {busqueda
              ? "Prueba con otro término de búsqueda."
              : "Aún no hay pedidos registrados."}
          </p>

        </div>

      ) : (

        <div className="products-table-container">

          <table className="products-table">

            <thead>

              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>

            </thead>

            <tbody>

              {pedidosFiltrados.map(
                (pedido) => (

                  <tr key={pedido.id}>

                    <td>
                      <strong>
                        #{pedido.id}
                      </strong>
                    </td>

                    <td>

                      <div className="product-info">

                        <div className="product-avatar">
                          {(pedido.usuario_nombre ||
                            "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>

                          <strong>
                            {pedido.usuario_nombre}
                          </strong>

                          <span>
                            {pedido.usuario_email}
                          </span>

                        </div>

                      </div>

                    </td>

                    <td>
                      {new Date(
                        pedido.fecha
                      ).toLocaleString(
                        "es-MX"
                      )}
                    </td>

                    <td>
                      <span className="order-products-badge">
                        {pedido.cantidad_productos}
                        {" "}unidad(es)
                      </span>
                    </td>

                    <td>

                      <strong>
                        $
                        {Number(
                          pedido.total
                        ).toLocaleString(
                          "es-MX",
                          {
                            minimumFractionDigits: 2
                          }
                        )}
                      </strong>

                    </td>

                    <td>

                      <span
                        className={`order-status order-status-${(
                          pedido.estado || ""
                        ).toLowerCase()}`}
                      >
                        {pedido.estado}
                      </span>

                    </td>

                    <td>

                      <div className="action-buttons">

                        <button
                          className="action-button view-button"
                          onClick={() =>
                            abrirDetallePedido(
                              pedido
                            )
                          }
                        >
                          Ver detalle
                        </button>

                        {pedido.estado ===
                          "PENDIENTE" && (
                          <>
                            <button
                              className="action-button accept-button"
                              onClick={() =>
                                aceptarPedido(
                                  pedido
                                )
                              }
                            >
                              Aceptar
                            </button>

                            <button
                              className="action-button reject-button"
                              onClick={() =>
                                rechazarPedido(
                                  pedido
                                )
                              }
                            >
                              Rechazar
                            </button>
                          </>
                        )}

                        <button
                          className="action-button delete-button"
                          onClick={() =>
                            eliminarPedido(
                              pedido
                            )
                          }
                        >
                          Eliminar
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      )}

      {mostrarDetalle && pedidoDetalle && (
        <OrderDetail
          pedido={pedidoDetalle}
          onClose={cerrarDetalle}
        />
      )}

    </div>
  );
}

export default OrderModule;
