import { useEffect, useState } from "react";
import {
  createUser,
  updateUser
} from "../services/userService";

function UserForm({
  usuarioEditar,
  onUserCreated,
  onUserUpdated,
  onClose
}) {
  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "cliente"
  });

  const [error, setError] = useState("");

  const modoEdicion = Boolean(usuarioEditar);

  useEffect(() => {
    if (usuarioEditar) {
      setFormulario({
        nombre: usuarioEditar.nombre,
        email: usuarioEditar.email,
        password: "",
        rol: usuarioEditar.rol
      });
    }
  }, [usuarioEditar]);

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
      const usuario = {
        nombre: formulario.nombre,
        email: formulario.email,
        password: formulario.password,
        rol: formulario.rol
      };

      if (modoEdicion) {
        await updateUser(usuarioEditar.id, usuario);

        if (onUserUpdated) {
          onUserUpdated();
        }
      } else {
        await createUser(usuario);

        if (onUserCreated) {
          onUserCreated();
        }
      }

      onClose();

    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>

      <div
        className="modal-container"
        onClick={(event) => event.stopPropagation()}
      >

        <div className="modal-header">

          <div>
            <h3>
              {modoEdicion
                ? "Editar usuario"
                : "Nuevo usuario"}
            </h3>

            <p>
              {modoEdicion
                ? "Actualiza la información de la cuenta"
                : "Registra una nueva cuenta en el sistema"}
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

            <label>Nombre completo</label>

            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              placeholder="Ej. Luis Angel Alegria Gomez"
              required
            />

          </div>

          <div className="form-group">

            <label>Correo electrónico</label>

            <input
              type="email"
              name="email"
              value={formulario.email}
              onChange={manejarCambio}
              placeholder="usuario@ejemplo.com"
              required
            />

          </div>

          <div className="form-group">

            <label>
              {modoEdicion
                ? "Nueva contraseña"
                : "Contraseña"}
            </label>

            <input
              type="password"
              name="password"
              value={formulario.password}
              onChange={manejarCambio}
              placeholder={
                modoEdicion
                  ? "Ingresa una nueva contraseña"
                  : "Mínimo 6 caracteres"
              }
              minLength="6"
              required
            />

          </div>

          <div className="form-group">

            <label>Rol</label>

            <select
              name="rol"
              value={formulario.rol}
              onChange={manejarCambio}
              required
            >
              <option value="cliente">
                Cliente
              </option>

              <option value="admin">
                Administrador
              </option>

              <option value="proveedor">
                Proveedor
              </option>

            </select>

          </div>

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
                : "Crear usuario"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default UserForm;
