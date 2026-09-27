import { useEffect, useState } from "react";
import {
  createProduct,
  updateProduct
} from "../services/productService";

function ProductForm({
  productoEditar,
  onProductCreated,
  onProductUpdated,
  onClose
}) {
  const [formulario, setFormulario] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    imagenUrl: ""
  });

  const [error, setError] = useState("");

  const modoEdicion = Boolean(productoEditar);

  useEffect(() => {
    if (productoEditar) {
      setFormulario({
        nombre: productoEditar.nombre,
        descripcion: productoEditar.descripcion || "",
        precio: productoEditar.precio,
        stock: productoEditar.stock,
        imagenUrl: productoEditar.imagen_url || ""
      });
    }
  }, [productoEditar]);

  function manejarCambio(event) {
    setFormulario({
      ...formulario,
      [event.target.name]: event.target.value
    });
  }

  async function manejarEnvio(event) {
    event.preventDefault();
    setError("");

    try {
      const producto = {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion,
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        imagenUrl: formulario.imagenUrl
      };

      if (modoEdicion) {
        await updateProduct(
          productoEditar.id,
          producto
        );

        if (onProductUpdated) {
          onProductUpdated();
        }
      } else {
        await createProduct(producto);

        if (onProductCreated) {
          onProductCreated();
        }
      }

      onClose();

    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >

      <div
        className="modal-container"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>
            <h3>
              {modoEdicion
                ? "Editar producto"
                : "Nuevo producto"}
            </h3>

            <p>
              {modoEdicion
                ? "Actualiza la información del producto"
                : "Agrega un producto al catálogo"}
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>

        </div>

        <form onSubmit={manejarEnvio}>

          <div className="form-group">

            <label>
              Nombre del producto
            </label>

            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              placeholder="Ej. Laptop Lenovo IdeaPad"
              required
            />

          </div>

          <div className="form-group">

            <label>
              Descripción
            </label>

            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={manejarCambio}
              placeholder="Describe las características del producto"
            />

          </div>

          <div className="form-group">

            <label>
              URL de imagen
            </label>

            <input
              type="url"
              name="imagenUrl"
              value={formulario.imagenUrl}
              onChange={manejarCambio}
              placeholder="https://ejemplo.com/imagen.jpg"
            />

          </div>

          <div className="form-row">

            <div className="form-group">

              <label>
                Precio
              </label>

              <div className="input-prefix">

                <span>$</span>

                <input
                  type="number"
                  name="precio"
                  value={formulario.precio}
                  onChange={manejarCambio}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Stock
              </label>

              <input
                type="number"
                name="stock"
                value={formulario.stock}
                onChange={manejarCambio}
                placeholder="0"
                min="0"
                step="1"
                required
              />

            </div>

          </div>

          {formulario.imagenUrl && (
            <div className="product-image-preview">

              <label>
                Vista previa
              </label>

              <img
                src={formulario.imagenUrl}
                alt="Vista previa del producto"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />

            </div>
          )}

          {error && (
            <p className="mensaje-error">
              {error}
            </p>
          )}

          <div className="modal-footer">

            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              {modoEdicion
                ? "Guardar cambios"
                : "Guardar producto"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default ProductForm;
