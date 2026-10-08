function Sidebar({ vistaActual, cambiarVista }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">EC</div>

        <div>
          <h2>E-Commerce</h2>
          <span>Panel administrativo</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <p className="menu-title">PRINCIPAL</p>

        <button
          className={vistaActual === "dashboard" ? "menu-item active" : "menu-item"}
          onClick={() => cambiarVista("dashboard")}
        >
          <span>Dashboard</span>
        </button>

        <button
          className={vistaActual === "reportes" ? "menu-item active" : "menu-item"}
          onClick={() => cambiarVista("reportes")}
        >
          <span>Reportes</span>
        </button>

        <p className="menu-title">GESTIÓN</p>

        <button
          className={vistaActual === "usuarios" ? "menu-item active" : "menu-item"}
          onClick={() => cambiarVista("usuarios")}
        >
          <span>Usuarios</span>
        </button>

        <button
          className={vistaActual === "productos" ? "menu-item active" : "menu-item"}
          onClick={() => cambiarVista("productos")}
        >
          <span>Productos</span>
        </button>

        <button
          className={vistaActual === "pedidos" ? "menu-item active" : "menu-item"}
          onClick={() => cambiarVista("pedidos")}
        >
          <span>Pedidos</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <strong>Sistema E-Commerce</strong>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}

export default Sidebar;
