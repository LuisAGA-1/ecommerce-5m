function Navbar({ vistaActual, cambiarVista }) {
  return (
    <aside className="sidebar">
      <div className="navbar-brand">
        E-Commerce
      </div>

      <nav className="navbar-links" aria-label="Navegación principal">
        <span className="nav-section-label">Menú principal</span>
        <button
          className={vistaActual === "dashboard" ? "active" : ""}
          onClick={() => cambiarVista("dashboard")}
        >
          <span className="nav-icon">⌂</span>
          Dashboard
        </button>
        <button
          className={vistaActual === "usuarios" ? "active" : ""}
          onClick={() => cambiarVista("usuarios")}
        >
          <span className="nav-icon">US</span>
          Usuarios
        </button>

        <button
          className={vistaActual === "productos" ? "active" : ""}
          onClick={() => cambiarVista("productos")}
        >
          <span className="nav-icon">PR</span>
          Productos
        </button>

        <button
          className={vistaActual === "pedidos" ? "active" : ""}
          onClick={() => cambiarVista("pedidos")}
        >
          <span className="nav-icon">PD</span>
          Pedidos
        </button>

        <span className="nav-divider" />
        <button className="nav-muted" type="button">
          <span className="nav-icon">⚙</span>
          Configuración
        </button>
      </nav>

      <div className="sidebar-footer">
        <span className="profile-avatar">AD</span>
        <div>
          <strong>Administrador</strong>
          <span>Panel de gestión</span>
        </div>
      </div>
    </aside>
  );
}

export default Navbar;

