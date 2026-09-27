const API_URL = "http://localhost:3000";

function obtenerHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`
        }
      : {})
  };
}


// =========================================================
// OBTENER TODOS LOS USUARIOS
// ADMIN
// =========================================================
export async function getUsers() {

  const response =
    await fetch(
      `${API_URL}/usuarios`,
      {
        headers:
          obtenerHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Error al obtener los usuarios"
    );
  }

  return data;
}


// =========================================================
// OBTENER USUARIO POR ID
// ADMIN
// =========================================================
export async function getUserById(id) {

  const response =
    await fetch(
      `${API_URL}/usuarios/${id}`,
      {
        headers:
          obtenerHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Usuario no encontrado"
    );
  }

  return data;
}


// =========================================================
// CREAR USUARIO
// ADMIN
// =========================================================
export async function createUser(user) {

  const response =
    await fetch(
      `${API_URL}/usuarios`,
      {
        method: "POST",

        headers:
          obtenerHeaders(),

        body:
          JSON.stringify(user)
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Error al crear usuario"
    );
  }

  return data;
}


// =========================================================
// ACTUALIZAR USUARIO
// ADMIN
// =========================================================
export async function updateUser(
  id,
  user
) {

  const response =
    await fetch(
      `${API_URL}/usuarios/${id}`,
      {
        method: "PUT",

        headers:
          obtenerHeaders(),

        body:
          JSON.stringify(user)
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Error al actualizar usuario"
    );
  }

  return data;
}


// =========================================================
// ELIMINAR USUARIO
// ADMIN
// =========================================================
export async function deleteUser(id) {

  const response =
    await fetch(
      `${API_URL}/usuarios/${id}`,
      {
        method: "DELETE",

        headers:
          obtenerHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Error al eliminar usuario"
    );
  }

  return data;
}
