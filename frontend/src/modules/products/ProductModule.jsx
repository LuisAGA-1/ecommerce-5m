import { useEffect, useState } from "react";

import ProductForm from "../../components/ProductForm";

import {
  getAllProducts,
  deleteProduct
} from "../../services/productService";

function ProductModule() {

  const [productos, setProductos] =
    useState([]);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [productoEditar, setProductoEditar] =
    useState(null);

  const [busqueda, setBusqueda] =
    useState("");

  // =========================================================
  // CARGAR TODOS LOS PRODUCTOS
  // Solo administrador
  // =========================================================
  async function cargarProductos() {

    try {

      const data =
        await getAllProducts();

      setProductos(data);
      setError("");

    } catch (error) {

      setError(
        error.message ||
        "Error al cargar productos"
      );
    }
  }

  useEffect(() => {

    cargarProductos();

  }, []);

  // =========================================================
  // NUEVO PRODUCTO
  // =========================================================
  function abrirNuevoProducto() {

    setProductoEditar(null);
    setMostrarModal(true);
    setMensaje("");
  }

  // =========================================================
  // EDITAR PRODUCTO
  // =========================================================
  function abrirEditarProducto(producto) {

    setProductoEditar(producto);
    setMostrarModal(true);
    setMensaje("");
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================
  function cerrarModal() {

    setMostrarModal(false);
    setProductoEditar(null);
  }

  // =========================================================
  // ELIMINAR PRODUCTO
  // =========================================================
  async function eliminarProducto(producto) {

    const confirmar =
      window.confirm(
        `¿Estás seguro de eliminar "${producto.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    try {

      await deleteProduct(producto.id);

      setMensaje(
        "Producto eliminado correctamente"
      );

      setError("");

      await cargarProductos();

    } catch (error) {

      setError(
        error.message ||
        "Error al eliminar producto"
      );

      setMensaje("");
    }
  }

  // =========================================================
  // PRODUCTO GUARDADO
  // =========================================================
  async function productoGuardado() {

    await cargarProductos();

    setMensaje(
      productoEditar
        ? "Producto actualizado correctamente"
        : "Producto creado correctamente"
    );
  }

  // =========================================================
  // FILTRO DE BÚSQUEDA
  // =========================================================
  const productosFiltrados =
    productos.filter(
      (producto) =>
        producto.nombre
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )
    );

  // =========================================================
  // ESTADO DEL STOCK
  // =========================================================
  function obtenerEstadoStock(stock) {

    if (stock === 0) {

      return {
        texto: "Agotado",
        clase: "stock-agotado"
      };
    }

    if (stock <= 5) {

      return {
        texto: "Stock bajo",
        clase: "stock-bajo"
      };
    }

    return {
      texto: "Disponible",
      clase: "stock-disponible"
    };
  }

  return (

    <div className="products-page">

      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <div className="page-header">

        <div>

          <h2>
            Productos
          </h2>

          <p>
            Administra el catálogo y la disponibilidad de productos.
          </p>

        </div>

        <button
          className="btn-primary"
          onClick={abrirNuevoProducto}
        >
          + Nuevo producto
        </button>

      </div>

      {/* =====================================================
          MENSAJES
      ===================================================== */}

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

      {/* =====================================================
          BÚSQUEDA
      ===================================================== */}

      <div className="products-toolbar">

        <div className="search-box">

          <span>
            ⌕
          </span>

          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value
              )
            }
          />

        </div>

        <div className="products-count">

          {productosFiltrados.length}
          {" "}
          productos

        </div>

      </div>

      {/* =====================================================
          LISTA DE PRODUCTOS
      ===================================================== */}

      {productosFiltrados.length === 0 ? (

        <div className="empty-state">

          <h3>
            No se encontraron productos
          </h3>

          <p>

            {busqueda
              ? "Prueba con otro término de búsqueda."
              : "Agrega tu primer producto al catálogo."}

          </p>

        </div>

      ) : (

        <div className="products-table-container">

          <table className="products-table">

            <thead>

              <tr>

                <th>
                  Producto
                </th>

                <th>
                  Precio
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              {productosFiltrados.map(
                (producto) => {

                  const estado =
                    obtenerEstadoStock(
                      Number(
                        producto.stock
                      )
                    );

                  return (

                    <tr
                      key={producto.id}
                    >

                      {/* PRODUCTO */}

                      <td>

                        <div className="product-info">

                          <div className="product-avatar">

                            {producto.nombre
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <strong>
                              {producto.nombre}
                            </strong>

                            <span>

                              {producto.descripcion ||
                                "Sin descripción"}

                            </span>

                          </div>

                        </div>

                      </td>

                      {/* PRECIO */}

                      <td>

                        <strong>

                          $
                          {Number(
                            producto.precio
                          ).toLocaleString(
                            "es-MX",
                            {
                              minimumFractionDigits: 2
                            }
                          )}

                        </strong>

                      </td>

                      {/* STOCK */}

                      <td>

                        {producto.stock}
                        {" "}
                        unidades

                      </td>

                      {/* ESTADO */}

                      <td>

                        <span
                          className={
                            `stock-badge ${estado.clase}`
                          }
                        >

                          {estado.texto}

                        </span>

                      </td>

                      {/* ACCIONES */}

                      <td>

                        <div className="action-buttons">

                          <button
                            className="action-button edit-button"
                            onClick={() =>
                              abrirEditarProducto(
                                producto
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            className="action-button delete-button"
                            onClick={() =>
                              eliminarProducto(
                                producto
                              )
                            }
                          >
                            Eliminar
                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                }
              )}

            </tbody>

          </table>

        </div>

      )}

      {/* =====================================================
          FORMULARIO
      ===================================================== */}

      {mostrarModal && (

        <ProductForm
          productoEditar={
            productoEditar
          }

          onProductCreated={
            productoGuardado
          }

          onProductUpdated={
            productoGuardado
          }

          onClose={
            cerrarModal
          }
        />

      )}

    </div>
  );
}

export default ProductModule;
