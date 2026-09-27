import { useEffect, useState } from "react";
import { getUsers } from "../services/userService";
import { getProducts } from "../services/productService";
import { getOrders } from "../services/orderService";

function Dashboard() {
  const [datos, setDatos] = useState({
    usuarios: [],
    productos: [],
    pedidos: []
  });
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarResumen() {
      try {
        const [usuarios, productos, pedidos] = await Promise.all([
          getUsers(),
          getProducts(),
          getOrders()
        ]);

        setDatos({ usuarios, productos, pedidos });
        setError("");
      } catch (error) {
        setError(error.message);
      }
    }

    cargarResumen();
  }, []);

  const inventario = datos.productos.reduce(
    (total, producto) => total + Number(producto.stock || 0),
    0
  );

  return (
    <section className="dashboard-view" aria-labelledby="dashboard-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Resumen general</p>
          <h1 id="dashboard-title">Dashboard</h1>
          <p className="page-description">
            Una vista rápida de la actividad de tu tienda.
          </p>
        </div>
        <div className="dashboard-status">
          <span className="status-dot" />
          Sistema operativo
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="stats-grid">
        <article className="stat-card stat-card-coral">
          <span className="stat-label">Usuarios</span>
          <strong>{datos.usuarios.length}</strong>
          <span className="stat-caption">registrados</span>
        </article>
        <article className="stat-card stat-card-teal">
          <span className="stat-label">Productos</span>
          <strong>{datos.productos.length}</strong>
          <span className="stat-caption">en catálogo</span>
        </article>
        <article className="stat-card stat-card-gold">
          <span className="stat-label">Pedidos</span>
          <strong>{datos.pedidos.length}</strong>
          <span className="stat-caption">registrados</span>
        </article>
        <article className="stat-card stat-card-blue">
          <span className="stat-label">Inventario</span>
          <strong>{inventario}</strong>
          <span className="stat-caption">unidades disponibles</span>
        </article>
      </div>

      <div className="activity-grid">
        <article className="activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Catálogo</p>
              <h2>Productos recientes</h2>
            </div>
            <span className="panel-count">{datos.productos.length}</span>
          </div>
          <div className="activity-list">
            {datos.productos.slice(-3).reverse().map((producto) => (
              <div className="activity-item" key={producto.id}>
                <span className="activity-avatar product-avatar">PR</span>
                <div>
                  <strong>{producto.nombre}</strong>
                  <span>Stock: {producto.stock}</span>
                </div>
                <b>${producto.precio}</b>
              </div>
            ))}
            {datos.productos.length === 0 && (
              <p className="empty-state">No hay productos registrados.</p>
            )}
          </div>
        </article>

        <article className="activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Actividad</p>
              <h2>Pedidos recientes</h2>
            </div>
            <span className="panel-count">{datos.pedidos.length}</span>
          </div>
          <div className="activity-list">
            {datos.pedidos.slice(-3).reverse().map((pedido) => (
              <div className="activity-item" key={pedido.id}>
                <span className="activity-avatar order-avatar">PD</span>
                <div>
                  <strong>Pedido #{pedido.id}</strong>
                  <span>{pedido.usuario_nombre || "Usuario"}</span>
                </div>
                <b>${pedido.total}</b>
              </div>
            ))}
            {datos.pedidos.length === 0 && (
              <p className="empty-state">No hay pedidos registrados.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default Dashboard;