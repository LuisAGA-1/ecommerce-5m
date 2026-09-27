import { useEffect, useState } from "react";
import { getUsers } from "../../services/userService";
import { getProducts } from "../../services/productService";
import { getOrders } from "../../services/orderService";

function Dashboard() {
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState("");

  async function cargarDatos() {
    try {
      const [usuariosData, productosData, pedidosData] =
        await Promise.all([
          getUsers(),
          getProducts(),
          getOrders()
        ]);

      setUsuarios(usuariosData);
      setProductos(productosData);
      setPedidos(pedidosData);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const stockTotal = productos.reduce(
    (total, producto) => total + Number(producto.stock),
    0
  );

  const ventasTotales = pedidos.reduce(
    (total, pedido) => total + Number(pedido.total),
    0
  );

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen general del sistema</p>
        </div>
      </div>

      {error && (
        <p className="mensaje-error">
          {error}
        </p>
      )}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-card-content">
            <span>Usuarios</span>
            <strong>{usuarios.length}</strong>
            <small>Usuarios registrados</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <span>Productos</span>
            <strong>{productos.length}</strong>
            <small>Productos registrados</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <span>Pedidos</span>
            <strong>{pedidos.length}</strong>
            <small>Pedidos registrados</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <span>Stock total</span>
            <strong>{stockTotal}</strong>
            <small>Unidades disponibles</small>
          </div>
        </div>

      </div>

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Productos</h3>
            <span>{productos.length} registrados</span>
          </div>

          {productos.length === 0 ? (
            <p>No hay productos registrados.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                </tr>
              </thead>

              <tbody>
                {productos.slice(0, 5).map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.nombre}</td>
                    <td>${producto.precio}</td>
                    <td>{producto.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Resumen de ventas</h3>
          </div>

          <div className="sales-summary">
            <span>Ventas registradas</span>
            <strong>${ventasTotales.toFixed(2)}</strong>
          </div>

          <div className="sales-summary">
            <span>Pedidos realizados</span>
            <strong>{pedidos.length}</strong>
          </div>

          <div className="sales-summary">
            <span>Usuarios registrados</span>
            <strong>{usuarios.length}</strong>
          </div>
        </div>

      </div>

      <div className="dashboard-card recent-orders">
        <div className="card-header">
          <h3>Pedidos recientes</h3>
          <span>{pedidos.length} pedidos</span>
        </div>

        {pedidos.length === 0 ? (
          <p>No hay pedidos registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {pedidos.slice(-5).reverse().map((pedido) => (
                <tr key={pedido.id}>
                  <td>#{pedido.id}</td>
                  <td>{pedido.usuario_nombre}</td>
                  <td>
                    {new Date(pedido.fecha).toLocaleString()}
                  </td>
                  <td>${pedido.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

export default Dashboard;
