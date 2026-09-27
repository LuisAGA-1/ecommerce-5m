const API_URL = "http://localhost:3000";

function obtenerHeaders() {

  const token =
    localStorage.getItem("token");

  return {
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`
        }
      : {})
  };
}


// =========================================================
// OBTENER TODOS LOS PEDIDOS
// ADMIN
// =========================================================
export async function getOrders() {

  const response =
    await fetch(
      `${API_URL}/pedidos`,
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
      "Error al obtener los pedidos"
    );
  }

  return data;
}


// =========================================================
// OBTENER UN PEDIDO
// ADMIN
// =========================================================
export async function getOrderById(id) {

  const response =
    await fetch(
      `${API_URL}/pedidos/${id}`,
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
      "Pedido no encontrado"
    );
  }

  return data;
}


// =========================================================
// OBTENER MIS PEDIDOS
// CLIENTE
// =========================================================
export async function getMyOrders() {

  const response =
    await fetch(
      `${API_URL}/pedidos/mis-pedidos`,
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
      "Error al obtener tus pedidos"
    );
  }

  return data;
}


// =========================================================
// CREAR PEDIDO
// CLIENTE
// =========================================================
export async function createOrder(
  order
) {

  const response =
    await fetch(
      `${API_URL}/pedidos`,
      {
        method: "POST",

        headers:
          obtenerHeaders(),

        body:
          JSON.stringify(order)
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Error al crear pedido"
    );
  }

  return data;
}


// =========================================================
// ACTUALIZAR PEDIDO
// ADMIN
// =========================================================
export async function updateOrder(
  id,
  order
) {

  const response =
    await fetch(
      `${API_URL}/pedidos/${id}`,
      {
        method: "PUT",

        headers:
          obtenerHeaders(),

        body:
          JSON.stringify(order)
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Error al actualizar pedido"
    );
  }

  return data;
}


// =========================================================
// ACEPTAR PEDIDO
// ADMIN
// =========================================================
export async function acceptOrder(
  id
) {

  const response =
    await fetch(
      `${API_URL}/pedidos/${id}/aceptar`,
      {
        method: "PATCH",

        headers:
          obtenerHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Error al aceptar el pedido"
    );
  }

  return data;
}


// =========================================================
// RECHAZAR PEDIDO
// ADMIN
// =========================================================
export async function rejectOrder(
  id
) {

  const response =
    await fetch(
      `${API_URL}/pedidos/${id}/rechazar`,
      {
        method: "PATCH",

        headers:
          obtenerHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.mensaje ||
      "Error al rechazar el pedido"
    );
  }

  return data;
}


// =========================================================
// ELIMINAR PEDIDO
// ADMIN
// =========================================================
export async function deleteOrder(
  id
) {

  const response =
    await fetch(
      `${API_URL}/pedidos/${id}`,
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
      "Error al eliminar pedido"
    );
  }

  return data;
}
