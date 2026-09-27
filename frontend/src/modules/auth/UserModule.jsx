import { useEffect, useState } from "react";
import UserForm from "../../components/UserForm";
import {
  getUsers,
  deleteUser
} from "../../services/userService";

function UserModule() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);

  const [busqueda, setBusqueda] = useState("");

  async function cargarUsuarios() {
    try {
      const data = await getUsers();

      setUsuarios(data);
      setError("");

    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  function abrirNuevoUsuario() {
    setUsuarioEditar(null);
    setMostrarModal(true);
    setMensaje("");
  }

  function abrirEditarUsuario(usuario) {
    setUsuarioEditar(usuario);
    setMostrarModal(true);
    setMensaje("");
  }

  function cerrarModal() {
    setMostrarModal(false);
    setUsuarioEditar(null);
  }

  async function eliminarUsuario(usuario) {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar a "${usuario.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await deleteUser(usuario.id);

      setMensaje("Usuario eliminado correctamente");
      setError("");

      await cargarUsuarios();

    } catch (error) {
      setError(error.message);
      setMensaje("");
    }
  }

  async function usuarioGuardado() {
    await cargarUsuarios();

    setMensaje(
      usuarioEditar
        ? "Usuario actualizado correctamente"
        : "Usuario creado correctamente"
    );
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase();

    return (
      usuario.nombre.toLowerCase().includes(texto) ||
      usuario.email.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="products-page">

      <div className="page-header">

        <div>
          <h2>Usuarios</h2>

          <p>
            Administra las cuentas y roles del sistema.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={abrirNuevoUsuario}
        >
          + Nuevo usuario
        </button>

      </div>

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

      <div className="products-toolbar">

        <div className="search-box">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
          />

        </div>

        <div className="products-count">
          {usuariosFiltrados.length} usuarios
        </div>

      </div>

      {usuariosFiltrados.length === 0 ? (

        <div className="empty-state">

          <h3>No se encontraron usuarios</h3>

          <p>
            {busqueda
              ? "Prueba con otro término de búsqueda."
              : "Agrega tu primer usuario al sistema."}
          </p>

        </div>

      ) : (

        <div className="products-table-container">

          <table className="products-table">

            <thead>

              <tr>
                <th>Usuario</th>
                <th>Correo electrónico</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>

            </thead>

            <tbody>

              {usuariosFiltrados.map((usuario) => (

                <tr key={usuario.id}>

                  <td>

                    <div className="product-info">

                      <div className="product-avatar">
                        {usuario.nombre
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <strong>
                          {usuario.nombre}
                        </strong>

                        <span>
                          ID #{usuario.id}
                        </span>

                      </div>

                    </div>

                  </td>

                  <td>
                    {usuario.email}
                  </td>

                  <td>

                    <span
                      className={
                        usuario.rol === "admin"
                          ? "role-badge role-admin"
                          : usuario.rol === "proveedor"
                            ? "role-badge role-provider"
                            : "role-badge role-client"
                      }
                    >
                      {usuario.rol === "admin"
                        ? "Administrador"
                        : usuario.rol === "proveedor"
                          ? "Proveedor"
                          : "Cliente"}
                    </span>

                  </td>

                  <td>

                    <div className="action-buttons">

                      <button
                        className="action-button edit-button"
                        onClick={() =>
                          abrirEditarUsuario(usuario)
                        }
                      >
                        Editar
                      </button>

                      <button
                        className="action-button delete-button"
                        onClick={() =>
                          eliminarUsuario(usuario)
                        }
                      >
                        Eliminar
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

      {mostrarModal && (

        <UserForm
          usuarioEditar={usuarioEditar}
          onUserCreated={usuarioGuardado}
          onUserUpdated={usuarioGuardado}
          onClose={cerrarModal}
        />

      )}

    </div>
  );
}

export default UserModule;
