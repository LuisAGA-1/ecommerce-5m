import { useEffect, useState } from "react";

import {
  createProduct,
  getMyProducts,
  publishProduct,
  unpublishProduct,
  updateProduct,
  deleteProduct
} from "../../services/productService";

function ProviderModule({
  vistaActual
}) {

  // =========================================================
  // ESTADOS
  // =========================================================

  const [productos, setProductos] =
    useState([]);

  const [cargando, setCargando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const [modoEdicion, setModoEdicion] =
    useState(false);

  const [productoEditando, setProductoEditando] =
    useState(null);

  const [formulario, setFormulario] =
    useState({
      nombre: "",
      descripcion: "",
      precio: "",
      stock: "",
      imagenUrl: ""
    });

  // =========================================================
  // CARGAR PRODUCTOS DEL PROVEEDOR
  // =========================================================

  async function cargarProductos() {

    try {

      setCargando(true);
      setError("");

      const data =
        await getMyProducts();

      setProductos(data);

    } catch (error) {

      setError(
        error.message ||
        "Error al cargar productos"
      );

    } finally {

      setCargando(false);
    }
  }

  // =========================================================
  // CARGAR PRODUCTOS AL ENTRAR A MIS PRODUCTOS
  // =========================================================

  useEffect(() => {

    if (
      vistaActual === "mis-productos" ||
      vistaActual === "publicados"
    ) {

      cargarProductos();
    }

  }, [vistaActual]);

  // =========================================================
  // CAMBIAR CAMPOS DEL FORMULARIO
  // =========================================================

  function manejarCambio(event) {

    const {
      name,
      value
    } = event.target;

    setFormulario({
      ...formulario,
      [name]: value
    });
  }

  // =========================================================
  // LIMPIAR FORMULARIO
  // =========================================================

  function limpiarFormulario() {

    setFormulario({
      nombre: "",
      descripcion: "",
      precio: "",
      stock: "",
      imagenUrl: ""
    });

    setModoEdicion(false);
    setProductoEditando(null);
  }

  // =========================================================
  // CREAR PRODUCTO
  // =========================================================

  async function manejarCrearProducto(event) {

    event.preventDefault();

    try {

      setMensaje("");
      setError("");

      await createProduct({
        nombre:
          formulario.nombre,

        descripcion:
          formulario.descripcion,

        precio:
          Number(formulario.precio),

        stock:
          Number(formulario.stock),

        imagenUrl:
          formulario.imagenUrl
      });

      setMensaje(
        "Producto creado correctamente"
      );

      limpiarFormulario();

      await cargarProductos();

    } catch (error) {

      setError(
        error.message ||
        "Error al crear producto"
      );
    }
  }

  // =========================================================
  // EDITAR PRODUCTO
  // =========================================================

  function manejarEditar(producto) {

    setMensaje("");
    setError("");

    setModoEdicion(true);
    setProductoEditando(producto);

    setFormulario({
      nombre:
        producto.nombre || "",

      descripcion:
        producto.descripcion || "",

      precio:
        producto.precio || "",

      stock:
        producto.stock || "",

      imagenUrl:
        producto.imagen_url || ""
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // =========================================================
  // GUARDAR CAMBIOS
  // =========================================================

  async function manejarActualizarProducto(event) {

    event.preventDefault();

    if (!productoEditando) {
      return;
    }

    try {

      setMensaje("");
      setError("");

      await updateProduct(
        productoEditando.id,
        {
          nombre:
            formulario.nombre,

          descripcion:
            formulario.descripcion,

          precio:
            Number(formulario.precio),

          stock:
            Number(formulario.stock),

          imagenUrl:
            formulario.imagenUrl
        }
      );

      setMensaje(
        "Producto actualizado correctamente"
      );

      limpiarFormulario();

      await cargarProductos();

    } catch (error) {

      setError(
        error.message ||
        "Error al actualizar producto"
      );
    }
  }

  // =========================================================
  // PUBLICAR
  // =========================================================

  async function manejarPublicar(id) {

    try {

      setMensaje("");
      setError("");

      await publishProduct(id);

      setMensaje(
        "Producto publicado correctamente"
      );

      await cargarProductos();

    } catch (error) {

      setError(
        error.message ||
        "Error al publicar producto"
      );
    }
  }

  // =========================================================
  // DESPUBLICAR
  // =========================================================

  async function manejarDespublicar(id) {

    try {

      setMensaje("");
      setError("");

      await unpublishProduct(id);

      setMensaje(
        "Producto despublicado correctamente"
      );

      await cargarProductos();

    } catch (error) {

      setError(
        error.message ||
        "Error al despublicar producto"
      );
    }
  }

  // =========================================================
  // ELIMINAR
  // =========================================================

  async function manejarEliminar(id) {

    const confirmar =
      window.confirm(
        "¿Seguro que deseas eliminar este producto?"
      );

    if (!confirmar) {
      return;
    }

    try {

      setMensaje("");
      setError("");

      await deleteProduct(id);

      setMensaje(
        "Producto eliminado correctamente"
      );

      await cargarProductos();

    } catch (error) {

      setError(
        error.message ||
        "Error al eliminar producto"
      );
    }
  }

  // =========================================================
  // INICIO
  // =========================================================

  if (
    vistaActual === "inicio"
  ) {

    return (

      <div className="module">

        <div className="module-header">

          <div>

            <h2>
              Panel del proveedor
            </h2>

            <p>
              Administra tus productos
              desde este panel.
            </p>

          </div>

        </div>

        <div className="dashboard-grid">

          <div className="dashboard-card">

            <h3>
              Crear productos
            </h3>

            <p>
              Registra nuevos productos
              en la tienda.
            </p>

          </div>

          <div className="dashboard-card">

            <h3>
              Mis productos
            </h3>

            <p>
              Consulta y administra
              tus productos.
            </p>

          </div>

          <div className="dashboard-card">

            <h3>
              Productos publicados
            </h3>

            <p>
              Controla los productos
              visibles para clientes.
            </p>

          </div>

        </div>

      </div>
    );
  }

  // =========================================================
  // CREAR / EDITAR PRODUCTO
  // =========================================================

  if (
    vistaActual === "crear-producto" ||
    modoEdicion
  ) {

    return (

      <div className="module">

        <div className="module-header">

          <div>

            <h2>
              {modoEdicion
                ? "Editar producto"
                : "Crear producto"}
            </h2>

            <p>
              {modoEdicion
                ? "Modifica los datos del producto."
                : "Registra un nuevo producto."}
            </p>

          </div>

        </div>

        {mensaje && (

          <div className="success-message">
            {mensaje}
          </div>

        )}

        {error && (

          <div className="error-message">
            {error}
          </div>

        )}

        <form
          onSubmit={
            modoEdicion
              ? manejarActualizarProducto
              : manejarCrearProducto
          }
          className="form-card"
        >

          <div className="form-group">

            <label>
              Nombre
            </label>

            <input
              type="text"
              name="nombre"
              value={
                formulario.nombre
              }
              onChange={
                manejarCambio
              }
              required
            />

          </div>

          <div className="form-group">

            <label>
              Descripción
            </label>

            <textarea
              name="descripcion"
              value={
                formulario.descripcion
              }
              onChange={
                manejarCambio
              }
              rows="4"
            />

          </div>

          <div className="form-row">

            <div className="form-group">

              <label>
                Precio
              </label>

              <input
                type="number"
                name="precio"
                value={
                  formulario.precio
                }
                onChange={
                  manejarCambio
                }
                min="0.01"
                step="0.01"
                required
              />

            </div>

            <div className="form-group">

              <label>
                Stock
              </label>

              <input
                type="number"
                name="stock"
                value={
                  formulario.stock
                }
                onChange={
                  manejarCambio
                }
                min="0"
                step="1"
                required
              />

            </div>

          </div>

          <div className="form-group">

            <label>
              URL de imagen
            </label>

            <input
              type="url"
              name="imagenUrl"
              value={
                formulario.imagenUrl
              }
              onChange={
                manejarCambio
              }
              placeholder="https://..."
            />

          </div>

          <div className="product-card-actions">

            <button
              type="submit"
              className="primary-button"
            >
              {modoEdicion
                ? "Guardar cambios"
                : "Crear producto"}
            </button>

            {modoEdicion && (

              <button
                type="button"
                className="secondary-button"
                onClick={
                  limpiarFormulario
                }
              >
                Cancelar
              </button>

            )}

          </div>

        </form>

      </div>
    );
  }

  // =========================================================
  // MIS PRODUCTOS / PUBLICADOS
  // =========================================================

  if (
    vistaActual === "mis-productos" ||
    vistaActual === "publicados"
  ) {

    const mostrarPublicados =
      vistaActual === "publicados";

    const productosMostrar =
      mostrarPublicados
        ? productos.filter(
            (producto) =>
              producto.publicado === true
          )
        : productos;

    return (

      <div className="module">

        <div className="module-header">

          <div>

            <h2>
              {mostrarPublicados
                ? "Productos publicados"
                : "Mis productos"}
            </h2>

            <p>
              {mostrarPublicados
                ? "Productos visibles para los clientes."
                : "Productos registrados por ti."}
            </p>

          </div>

          <button
            className="secondary-button"
            onClick={
              cargarProductos
            }
          >
            Actualizar
          </button>

        </div>

        {mensaje && (

          <div className="success-message">
            {mensaje}
          </div>

        )}

        {error && (

          <div className="error-message">
            {error}
          </div>

        )}

        {cargando ? (

          <p>
            Cargando productos...
          </p>

        ) : productosMostrar.length === 0 ? (

          <div className="empty-state">

            <h3>
              No hay productos
            </h3>

            <p>
              {mostrarPublicados
                ? "Todavía no tienes productos publicados."
                : "Todavía no has creado productos."}
            </p>

          </div>

        ) : (

          <div className="products-grid">

            {productosMostrar.map(
              (producto) => (

                <div
                  key={producto.id}
                  className="product-card"
                >

                  {producto.imagen_url ? (

                    <img
                      src={
                        producto.imagen_url
                      }
                      alt={
                        producto.nombre
                      }
                      className="product-card-image"
                    />

                  ) : (

                    <div className="product-card-image-placeholder">
                      Sin imagen
                    </div>

                  )}

                  <div className="product-card-body">

                    <h3>
                      {producto.nombre}
                    </h3>

                    <p>
                      {producto.descripcion}
                    </p>

                    <strong>
                      ${producto.precio}
                    </strong>

                    <span>
                      Stock: {producto.stock}
                    </span>

                    <span>
                      Estado:{" "}
                      {producto.publicado
                        ? "Publicado"
                        : "No publicado"}
                    </span>

                    {!mostrarPublicados && (

                      <div className="product-card-actions">

                        <button
                          className="secondary-button"
                          onClick={() =>
                            manejarEditar(
                              producto
                            )
                          }
                        >
                          Editar
                        </button>

                        {producto.publicado ? (

                          <button
                            className="secondary-button"
                            onClick={() =>
                              manejarDespublicar(
                                producto.id
                              )
                            }
                          >
                            Despublicar
                          </button>

                        ) : (

                          <button
                            className="primary-button"
                            onClick={() =>
                              manejarPublicar(
                                producto.id
                              )
                            }
                          >
                            Publicar
                          </button>

                        )}

                        <button
                          className="danger-button"
                          onClick={() =>
                            manejarEliminar(
                              producto.id
                            )
                          }
                        >
                          Eliminar
                        </button>

                      </div>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>
    );
  }

  return null;
}

export default ProviderModule;
