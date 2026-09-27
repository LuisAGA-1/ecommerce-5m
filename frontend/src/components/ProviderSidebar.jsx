function ProviderSidebar({
  vistaActual,
  cambiarVista
}) {

  return (

    <aside className="sidebar">

      <div className="sidebar-header">

        <div className="sidebar-logo">
          PV
        </div>

        <div>

          <h2>
            E-Commerce
          </h2>

          <span>
            Panel de proveedor
          </span>

        </div>

      </div>

      <nav className="sidebar-menu">

        <p className="menu-title">
          PRINCIPAL
        </p>

        <button
          className={
            vistaActual === "inicio"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() =>
            cambiarVista("inicio")
          }
        >
          <span>
            Inicio
          </span>
        </button>

        <p className="menu-title">
          PRODUCTOS
        </p>

        <button
          className={
            vistaActual === "crear-producto"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() =>
            cambiarVista("crear-producto")
          }
        >
          <span>
            Crear producto
          </span>
        </button>

        <button
          className={
            vistaActual === "mis-productos"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() =>
            cambiarVista("mis-productos")
          }
        >
          <span>
            Mis productos
          </span>
        </button>

        <button
          className={
            vistaActual === "publicados"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() =>
            cambiarVista("publicados")
          }
        >
          <span>
            Productos publicados
          </span>
        </button>

      </nav>

      <div className="sidebar-footer">

        <strong>
          Sistema E-Commerce
        </strong>

        <span>
          Proveedor
        </span>

      </div>

    </aside>
  );
}

export default ProviderSidebar;
