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
// PRODUCTOS PUBLICADOS
// Catálogo que pueden consultar los clientes
// =========================================================
export async function getProducts() {

  const response = await fetch(
    `${API_URL}/productos/publicados`
  );

  if (!response.ok) {
    throw new Error(
      "Error al obtener los productos"
    );
  }

  return await response.json();
}

// =========================================================
// TODOS LOS PRODUCTOS
// Solo administrador
// =========================================================
export async function getAllProducts() {

  const response = await fetch(
    `${API_URL}/productos`,
    {
      headers: obtenerHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "Error al obtener todos los productos"
    );
  }

  return data;
}

// =========================================================
// PRODUCTO POR ID
// =========================================================
export async function getProductById(id) {

  const response = await fetch(
    `${API_URL}/productos/${id}`
  );

  if (!response.ok) {
    throw new Error(
      "Producto no encontrado"
    );
  }

  return await response.json();
}

// =========================================================
// CREAR PRODUCTO
// =========================================================
export async function createProduct(product) {

  const response = await fetch(
    `${API_URL}/productos`,
    {
      method: "POST",
      headers: obtenerHeaders(),
      body: JSON.stringify(product)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "Error al crear producto"
    );
  }

  return data;
}

// =========================================================
// MIS PRODUCTOS
// Solo proveedor
// =========================================================
export async function getMyProducts() {

  const response = await fetch(
    `${API_URL}/productos/mis-productos`,
    {
      headers: obtenerHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "Error al obtener mis productos"
    );
  }

  return data;
}

// =========================================================
// ACTUALIZAR PRODUCTO
// =========================================================
export async function updateProduct(
  id,
  product
) {

  const response = await fetch(
    `${API_URL}/productos/${id}`,
    {
      method: "PUT",
      headers: obtenerHeaders(),
      body: JSON.stringify(product)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "Error al actualizar producto"
    );
  }

  return data;
}

// =========================================================
// PUBLICAR PRODUCTO
// =========================================================
export async function publishProduct(id) {

  const response = await fetch(
    `${API_URL}/productos/${id}/publicar`,
    {
      method: "PATCH",
      headers: obtenerHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "Error al publicar producto"
    );
  }

  return data;
}

// =========================================================
// DESPUBLICAR PRODUCTO
// =========================================================
export async function unpublishProduct(id) {

  const response = await fetch(
    `${API_URL}/productos/${id}/despublicar`,
    {
      method: "PATCH",
      headers: obtenerHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "Error al despublicar producto"
    );
  }

  return data;
}

// =========================================================
// ELIMINAR PRODUCTO
// =========================================================
export async function deleteProduct(id) {

  const response = await fetch(
    `${API_URL}/productos/${id}`,
    {
      method: "DELETE",
      headers: obtenerHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "Error al eliminar producto"
    );
  }

  return data;
}
