import { useEffect, useState } from "react";

import {
  getProducts
} from "../../services/productService";

import {
  createOrder,
  getMyOrders
} from "../../services/orderService";

function ClientModule({
  vistaActual,
  cambiarVista
}) {

  const [productos, setProductos] =
    useState([]);

  const [carrito, setCarrito] =
    useState([]);

  const [pedidos, setPedidos] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [cargandoPedidos, setCargandoPedidos] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  // CARGAR PRODUCTOS
  async function cargarProductos() {

    try {

      setCargando(true);
      setError("");

      const data =
        await getProducts();

      setProductos(data);

    } catch (error) {

      console.error(error);

      setError(
        "No se pudieron cargar los productos"
      );

    } finally {

      setCargando(false);
    }
  }

  // CARGAR MIS PEDIDOS
  async function cargarMisPedidos() {

    try {

      setCargandoPedidos(true);
      setError("");

      const data =
        await getMyOrders();

      setPedidos(data);

    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "No se pudieron cargar tus pedidos"
      );

    } finally {

      setCargandoPedidos(false);
    }
  }

  useEffect(() => {

    cargarProductos();

  }, []);

  useEffect(() => {

    if (vistaActual === "pedidos") {
      cargarMisPedidos();
    }

  }, [vistaActual]);

  // AGREGAR AL CARRITO
  function agregarAlCarrito(producto) {

    setMensaje("");
    setError("");

    const productoExistente =
      carrito.find(
        item =>
          item.id === producto.id
      );

    if (Number(producto.stock) <= 0) {

      setError(
        "Este producto no tiene stock disponible"
      );

      return;
    }

    if (productoExistente) {

      if (
        productoExistente.cantidad >=
        Number(producto.stock)
      ) {

        setError(
          "No puedes agregar más unidades de las disponibles"
        );

        return;
      }

      setCarrito(
        carrito.map(item =>
          item.id === producto.id
            ? {
                ...item,
                cantidad:
                  item.cantidad + 1
              }
            : item
        )
      );

      return;
    }

    setCarrito([
      ...carrito,
      {
        ...producto,
        cantidad: 1
      }
    ]);
  }

  // AUMENTAR CANTIDAD
  function aumentarCantidad(id) {

    setCarrito(
      carrito.map(item => {

        if (item.id !== id) {
          return item;
        }

        if (
          item.cantidad >=
          Number(item.stock)
        ) {
          return item;
        }

        return {
          ...item,
          cantidad:
            item.cantidad + 1
        };

      })
    );
  }

  // DISMINUIR CANTIDAD
  function disminuirCantidad(id) {

    setCarrito(
      carrito
        .map(item => {

          if (item.id !== id) {
            return item;
          }

          return {
            ...item,
            cantidad:
              item.cantidad - 1
          };

        })
        .filter(
          item =>
            item.cantidad > 0
        )
    );
  }

  // ELIMINAR DEL CARRITO
  function eliminarDelCarrito(id) {

    setCarrito(
      carrito.filter(
        item =>
          item.id !== id
      )
    );
  }

  // TOTAL
  const total =
    carrito.reduce(
      (suma, item) =>
        suma +
        Number(item.precio) *
        item.cantidad,
      0
    );

  // CANTIDAD TOTAL
  const cantidadTotal =
    carrito.reduce(
      (suma, item) =>
        suma + item.cantidad,
      0
    );

  // PRODUCTOS DISPONIBLES
  const productosDisponibles =
    productos.filter(
      producto =>
        Number(producto.stock) > 0
    );

  // ENVIAR PEDIDO
  async function realizarPedido() {

    setMensaje("");
    setError("");

    if (carrito.length === 0) {

      setError(
        "El carrito está vacío"
      );

      return;
    }

    const usuarioGuardado =
      localStorage.getItem("usuario");

    if (!usuarioGuardado) {

      setError(
        "No se encontró el usuario autenticado"
      );

      return;
    }

    try {

      const usuario =
        JSON.parse(
          usuarioGuardado
        );

      const detalles =
        carrito.map(item => ({
          productoId: item.id,
          cantidad: item.cantidad
        }));

      await createOrder({
        usuarioId: usuario.id,
        detalles
      });

      setCarrito([]);

      setMensaje(
        "Pedido enviado correctamente. Ahora está pendiente de revisión por el administrador."
      );

      await cargarProductos();

      await cargarMisPedidos();

    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "No se pudo enviar el pedido"
      );
    }
  }

  // FORMATO DE PRECIO
  function formatearPrecio(precio) {

    return Number(
      precio
    ).toLocaleString(
      "es-MX",
      {
        minimumFractionDigits: 2
      }
    );
  }

  // FORMATO DE FECHA
  function formatearFecha(fecha) {

    return new Date(
      fecha
    ).toLocaleString(
      "es-MX"
    );
  }

  // CLASE DEL ESTADO
  function obtenerEstadoClase(estado) {

    return `client-order-status client-order-status-${(
      estado || ""
    ).toLowerCase()}`;
  }

  // CARGANDO
  if (
    cargando &&
    vistaActual !== "pedidos"
  ) {

    return (
      <div className="client-loading">
        Cargando productos...
      </div>
    );
  }

  // INICIO
  if (vistaActual === "inicio") {

    return (

      <div className="client-view">

        <div className="client-welcome-card">

          <div>

            <span className="client-eyebrow">
              BIENVENIDO A LA TIENDA
            </span>

            <h2>
              Compra de forma sencilla
            </h2>

            <p>
              Explora nuestro catálogo,
              agrega productos a tu carrito
              y envía tu pedido al administrador.
            </p>

            <button
              className="client-primary-button"
              onClick={() =>
                cambiarVista("productos")
              }
            >
              Ver productos
            </button>

          </div>

        </div>

        <div className="client-stats-grid">

          <div className="client-stat-card">

            <span className="client-stat-label">
              Productos disponibles
            </span>

            <strong>
              {productosDisponibles.length}
            </strong>

            <span>
              En catálogo
            </span>

          </div>

          <div className="client-stat-card">

            <span className="client-stat-label">
              Productos en carrito
            </span>

            <strong>
              {cantidadTotal}
            </strong>

            <span>
              Unidades
            </span>

          </div>

          <div className="client-stat-card">

            <span className="client-stat-label">
              Mis pedidos
            </span>

            <strong>
              {pedidos.length}
            </strong>

            <span>
              Pedidos realizados
            </span>

          </div>

          <div className="client-stat-card">

            <span className="client-stat-label">
              Total del carrito
            </span>

            <strong>
              ${formatearPrecio(total)}
            </strong>

            <span>
              Por enviar
            </span>

          </div>

        </div>

        <div className="client-home-section">

          <div className="client-section-header">

            <div>

              <span className="client-eyebrow">
                CATÁLOGO
              </span>

              <h2>
                Productos destacados
              </h2>

            </div>

            <button
              className="client-link-button"
              onClick={() =>
                cambiarVista("productos")
              }
            >
              Ver todos
            </button>

          </div>

          <div className="client-product-grid">

            {productosDisponibles
              .slice(0, 3)
              .map(producto => (

                <article
                  className="client-product-card"
                  key={producto.id}
                >

                  <div className="client-product-image">

                    {producto.imagen_url ? (

                      <img
                        src={
                          producto.imagen_url
                        }
                        alt={
                          producto.nombre
                        }
                      />

                    ) : (

                      <div className="product-image-placeholder">
                        Sin imagen
                      </div>

                    )}

                  </div>

                  <div className="client-product-info">

                    <h3>
                      {producto.nombre}
                    </h3>

                    <p className="client-product-description">
                      {producto.descripcion ||
                        "Sin descripción"}
                    </p>

                    <div className="client-product-bottom">

                      <strong className="client-product-price">
                        $
                        {formatearPrecio(
                          producto.precio
                        )}
                      </strong>

                      <button
                        className="client-add-button"
                        onClick={() =>
                          agregarAlCarrito(
                            producto
                          )
                        }
                      >
                        Agregar
                      </button>

                    </div>

                  </div>

                </article>

              ))}

          </div>

        </div>

      </div>
    );
  }

  // PRODUCTOS
  if (vistaActual === "productos") {

    return (

      <div className="client-view">

        {error && (
          <div className="client-message error">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="client-message success">
            {mensaje}
          </div>
        )}

        <div className="client-section-header">

          <div>

            <span className="client-eyebrow">
              CATÁLOGO
            </span>

            <h2>
              Productos disponibles
            </h2>

            <p>
              Selecciona los productos que deseas solicitar.
            </p>

          </div>

          <button
            className="client-cart-summary-button"
            onClick={() =>
              cambiarVista("carrito")
            }
          >
            Carrito
            <span>
              {cantidadTotal}
            </span>
          </button>

        </div>

        {productosDisponibles.length === 0 ? (

          <div className="client-empty-state">

            <h3>
              No hay productos disponibles
            </h3>

            <p>
              Actualmente no hay productos
              con stock.
            </p>

          </div>

        ) : (

          <div className="client-product-grid">

            {productosDisponibles.map(
              producto => (

                <article
                  className="client-product-card"
                  key={producto.id}
                >

                  <div className="client-product-image">

                    {producto.imagen_url ? (

                      <img
                        src={
                          producto.imagen_url
                        }
                        alt={
                          producto.nombre
                        }
                      />

                    ) : (

                      <div className="product-image-placeholder">
                        Sin imagen
                      </div>

                    )}

                  </div>

                  <div className="client-product-info">

                    <h3>
                      {producto.nombre}
                    </h3>

                    <p className="client-product-description">
                      {producto.descripcion ||
                        "Sin descripción"}
                    </p>

                    <div className="client-product-meta">

                      <span>
                        Stock disponible:{" "}
                        {producto.stock}
                      </span>

                    </div>

                    <div className="client-product-bottom">

                      <strong className="client-product-price">
                        $
                        {formatearPrecio(
                          producto.precio
                        )}
                      </strong>

                      <button
                        className="client-add-button"
                        onClick={() =>
                          agregarAlCarrito(
                            producto
                          )
                        }
                      >
                        Agregar
                      </button>

                    </div>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </div>
    );
  }

  // CARRITO
  if (vistaActual === "carrito") {

    return (

      <div className="client-view">

        {error && (
          <div className="client-message error">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="client-message success">
            {mensaje}
          </div>
        )}

        <div className="client-section-header">

          <div>

            <span className="client-eyebrow">
              COMPRA
            </span>

            <h2>
              Mi carrito
            </h2>

            <p>
              Revisa tus productos antes de enviar el pedido.
            </p>

          </div>

          <span className="client-cart-count">
            {cantidadTotal} producto
            {cantidadTotal !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {carrito.length === 0 ? (

          <div className="client-empty-state">

            <h3>
              Tu carrito está vacío
            </h3>

            <p>
              Agrega productos del catálogo
              para comenzar tu pedido.
            </p>

            <button
              className="client-primary-button"
              onClick={() =>
                cambiarVista("productos")
              }
            >
              Explorar productos
            </button>

          </div>

        ) : (

          <div className="client-cart-page">

            <div className="client-cart-list">

              {carrito.map(item => (

                <div
                  className="client-cart-item"
                  key={item.id}
                >

                  <div className="client-cart-item-image">

                    {item.imagen_url ? (

                      <img
                        src={
                          item.imagen_url
                        }
                        alt={
                          item.nombre
                        }
                      />

                    ) : (

                      <span>
                        Sin imagen
                      </span>

                    )}

                  </div>

                  <div className="client-cart-item-info">

                    <h3>
                      {item.nombre}
                    </h3>

                    <span>
                      $
                      {formatearPrecio(
                        item.precio
                      )}{" "}
                      por unidad
                    </span>

                  </div>

                  <div className="client-cart-controls">

                    <button
                      onClick={() =>
                        disminuirCantidad(
                          item.id
                        )
                      }
                    >
                      −
                    </button>

                    <strong>
                      {item.cantidad}
                    </strong>

                    <button
                      onClick={() =>
                        aumentarCantidad(
                          item.id
                        )
                      }
                    >
                      +
                    </button>

                  </div>

                  <strong className="client-cart-item-total">
                    $
                    {formatearPrecio(
                      Number(item.precio) *
                      item.cantidad
                    )}
                  </strong>

                  <button
                    className="client-cart-remove"
                    onClick={() =>
                      eliminarDelCarrito(
                        item.id
                      )
                    }
                  >
                    Eliminar
                  </button>

                </div>

              ))}

            </div>

            <aside className="client-cart-summary">

              <span>
                RESUMEN DEL PEDIDO
              </span>

              <h3>
                Total
              </h3>

              <strong>
                $
                {formatearPrecio(
                  total
                )}
              </strong>

              <button
                className="client-checkout-button"
                onClick={
                  realizarPedido
                }
              >
                Enviar pedido
              </button>

              <button
                className="client-secondary-button"
                onClick={() =>
                  cambiarVista("productos")
                }
              >
                Seguir comprando
              </button>

              <p>
                Tu pedido quedará pendiente
                hasta que el administrador
                lo revise.
              </p>

            </aside>

          </div>

        )}

      </div>
    );
  }

  // MIS PEDIDOS
  if (vistaActual === "pedidos") {

    return (

      <div className="client-view">

        {error && (
          <div className="client-message error">
            {error}
          </div>
        )}

        <div className="client-section-header">

          <div>

            <span className="client-eyebrow">
              HISTORIAL
            </span>

            <h2>
              Mis pedidos
            </h2>

            <p>
              Consulta el estado de los pedidos que has realizado.
            </p>

          </div>

          <button
            className="client-secondary-button"
            onClick={
              cargarMisPedidos
            }
          >
            Actualizar
          </button>

        </div>

        {cargandoPedidos ? (

          <div className="client-loading">
            Cargando tus pedidos...
          </div>

        ) : pedidos.length === 0 ? (

          <div className="client-empty-state">

            <h3>
              Todavía no tienes pedidos
            </h3>

            <p>
              Cuando realices tu primer pedido
              aparecerá aquí.
            </p>

            <button
              className="client-primary-button"
              onClick={() =>
                cambiarVista("productos")
              }
            >
              Ver productos
            </button>

          </div>

        ) : (

          <div className="client-orders-list">

            {pedidos.map(pedido => (

              <article
                className="client-order-card"
                key={pedido.id}
              >

                <div className="client-order-header">

                  <div>

                    <span>
                      PEDIDO
                    </span>

                    <h3>
                      #{pedido.id}
                    </h3>

                  </div>

                  <span
                    className={obtenerEstadoClase(
                      pedido.estado
                    )}
                  >
                    {pedido.estado}
                  </span>

                </div>

                <div className="client-order-details">

                  <div>

                    <span>
                      Fecha
                    </span>

                    <strong>
                      {formatearFecha(
                        pedido.fecha
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Productos
                    </span>

                    <strong>
                      {pedido.cantidad_productos}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Total
                    </span>

                    <strong>
                      $
                      {formatearPrecio(
                        pedido.total
                      )}
                    </strong>

                  </div>

                </div>

                {pedido.estado === "PENDIENTE" && (

                  <p className="client-order-note">
                    Tu pedido está esperando
                    revisión del administrador.
                  </p>

                )}

                {pedido.estado === "ACEPTADO" && (

                  <p className="client-order-note">
                    Tu pedido fue aceptado.
                  </p>

                )}

                {pedido.estado === "RECHAZADO" && (

                  <p className="client-order-note">
                    Tu pedido fue rechazado
                    por el administrador.
                  </p>

                )}

              </article>

            ))}

          </div>

        )}

      </div>
    );
  }

  return null;
}

export default ClientModule;


