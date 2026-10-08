import { useState } from "react";

import Sidebar from "./components/Sidebar";

import ProviderSidebar
  from "./components/ProviderSidebar";

import Dashboard
  from "./modules/dashboard/Dashboard";

import AnalyticsDashboard
  from "./modules/analytics/AnalyticsDashboard";

import UserModule
  from "./modules/auth/UserModule";

import ProductModule
  from "./modules/products/ProductModule";

import OrderModule
  from "./modules/orders/OrderModule";

import ClientModule
  from "./modules/client/ClientModule";

import ProviderModule
  from "./modules/provider/ProviderModule";

import Login from "./components/Login";

function App() {

  const [usuario, setUsuario] = useState(() => {

    const usuarioGuardado =
      localStorage.getItem("usuario");

    return usuarioGuardado
      ? JSON.parse(usuarioGuardado)
      : null;
  });

  const [vistaActual, setVistaActual] =
    useState("dashboard");

  // =========================================================
  // LOGIN
  // =========================================================

  function manejarLogin(
    usuarioAutenticado
  ) {

    setUsuario(
      usuarioAutenticado
    );

    if (
      usuarioAutenticado.rol === "admin"
    ) {

      setVistaActual(
        "dashboard"
      );

    } else {

      setVistaActual(
        "inicio"
      );
    }
  }

  // =========================================================
  // CERRAR SESIÓN
  // =========================================================

  function cerrarSesion() {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "usuario"
    );

    setUsuario(null);

    setVistaActual(
      "dashboard"
    );
  }

  // =========================================================
  // NO AUTENTICADO
  // =========================================================

  if (!usuario) {

    return (
      <Login
        onLogin={
          manejarLogin
        }
      />
    );
  }

  // =========================================================
  // CLIENTE
  // =========================================================

  if (
    usuario.rol === "cliente"
  ) {

    return (

      <div className="client-dashboard">

        {/* ================================================= */}
        {/* BARRA SUPERIOR */}
        {/* ================================================= */}

        <header className="client-topbar">

          <div className="client-brand">

            <div className="client-brand-icon">
              🛒
            </div>

            <div>

              <strong>
                E-Commerce
              </strong>

              <span>
                Tienda en línea
              </span>

            </div>

          </div>

          <div className="client-user">

            <div className="client-user-avatar">

              {usuario.nombre
                ?.charAt(0)
                .toUpperCase()}

            </div>

            <div className="client-user-info">

              <strong>
                {usuario.nombre}
              </strong>

              <span>
                Cliente
              </span>

            </div>

            <button
              onClick={
                cerrarSesion
              }
              className="client-logout-button"
            >
              Cerrar sesión
            </button>

          </div>

        </header>

        {/* ================================================= */}
        {/* CUERPO */}
        {/* ================================================= */}

        <div className="client-dashboard-body">

          {/* ================================================= */}
          {/* MENÚ LATERAL */}
          {/* ================================================= */}

          <aside className="client-sidebar">

            <div className="client-sidebar-title">
              MENÚ
            </div>

            <nav>

              <button
                className={
                  vistaActual === "inicio"
                    ? "client-nav-item active"
                    : "client-nav-item"
                }
                onClick={() =>
                  setVistaActual(
                    "inicio"
                  )
                }
              >
                <span>
                  Inicio
                </span>
              </button>

              <button
                className={
                  vistaActual === "productos"
                    ? "client-nav-item active"
                    : "client-nav-item"
                }
                onClick={() =>
                  setVistaActual(
                    "productos"
                  )
                }
              >
                <span>
                  Productos
                </span>
              </button>

              <button
                className={
                  vistaActual === "carrito"
                    ? "client-nav-item active"
                    : "client-nav-item"
                }
                onClick={() =>
                  setVistaActual(
                    "carrito"
                  )
                }
              >
                <span>
                  Mi carrito
                </span>
              </button>

              <button
                className={
                  vistaActual === "pedidos"
                    ? "client-nav-item active"
                    : "client-nav-item"
                }
                onClick={() =>
                  setVistaActual(
                    "pedidos"
                  )
                }
              >
                <span>
                  Mis pedidos
                </span>
              </button>

            </nav>

          </aside>

          {/* ================================================= */}
          {/* CONTENIDO */}
          {/* ================================================= */}

          <main className="client-main">

            <div className="client-main-header">

              <span>
                PANEL DEL CLIENTE
              </span>

              <h1>

                {vistaActual === "inicio" &&
                  "Inicio"}

                {vistaActual === "productos" &&
                  "Productos"}

                {vistaActual === "carrito" &&
                  "Mi carrito"}

                {vistaActual === "pedidos" &&
                  "Mis pedidos"}

              </h1>

            </div>

            <ClientModule
              vistaActual={
                vistaActual
              }
              cambiarVista={
                setVistaActual
              }
            />

          </main>

        </div>

      </div>
    );
  }

  // =========================================================
  // PROVEEDOR
  // =========================================================

  if (
    usuario.rol === "proveedor"
  ) {

    return (

      <div className="app-layout">

        <ProviderSidebar
          vistaActual={
            vistaActual
          }
          cambiarVista={
            setVistaActual
          }
        />

        <div className="main-area">

          <header className="top-header">

            <div>

              <span className="header-label">
                SISTEMA DE E-COMMERCE
              </span>

              <h1>

                {vistaActual === "inicio" &&
                  "Panel del proveedor"}

                {vistaActual === "crear-producto" &&
                  "Crear producto"}

                {vistaActual === "mis-productos" &&
                  "Mis productos"}

                {vistaActual === "publicados" &&
                  "Productos publicados"}

              </h1>

            </div>

            <div className="admin-profile">

              <div className="admin-avatar">
                P
              </div>

              <div>

                <strong>
                  {usuario.nombre}
                </strong>

                <span>
                  Proveedor
                </span>

              </div>

              <button
                onClick={
                  cerrarSesion
                }
                className="logout-button"
              >
                Cerrar sesión
              </button>

            </div>

          </header>

          <main className="contenido">

            <ProviderModule
              vistaActual={
                vistaActual
              }
            />

          </main>

        </div>

      </div>
    );
  }

  // =========================================================
  // ADMINISTRADOR
  // =========================================================

  return (

    <div className="app-layout">

      <Sidebar
        vistaActual={
          vistaActual
        }
        cambiarVista={
          setVistaActual
        }
      />

      <div className="main-area">

        <header className="top-header">

          <div>

            <span className="header-label">
              SISTEMA DE ADMINISTRACIÓN
            </span>

            <h1>

              {vistaActual === "dashboard" &&
                "Dashboard"}

              {vistaActual === "reportes" &&
                "Reportes y Analítica"}

              {vistaActual === "usuarios" &&
                "Gestión de Usuarios"}

              {vistaActual === "productos" &&
                "Gestión de Productos"}

              {vistaActual === "pedidos" &&
                "Gestión de Pedidos"}

            </h1>

          </div>

          <div className="admin-profile">

            <div className="admin-avatar">
              A
            </div>

            <div>

              <strong>
                {usuario.nombre}
              </strong>

              <span>
                Administrador
              </span>

            </div>

            <button
              onClick={
                cerrarSesion
              }
              className="logout-button"
            >
              Cerrar sesión
            </button>

          </div>

        </header>

        <main className="contenido">

          {vistaActual === "dashboard" && (
            <Dashboard />
          )}

          {/* Vista protegida: solo se renderiza en el layout de admin
              y el backend exige rol admin en /api/reportes */}
          {vistaActual === "reportes" && (
            <AnalyticsDashboard />
          )}

          {vistaActual === "usuarios" && (
            <UserModule />
          )}

          {vistaActual === "productos" && (
            <ProductModule />
          )}

          {vistaActual === "pedidos" && (
            <OrderModule />
          )}

        </main>

      </div>

    </div>
  );
}

export default App;
