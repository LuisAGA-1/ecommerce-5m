const API_URL = "http://localhost:3000";

function obtenerHeaders() {

  const token =
    localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {})
  };
}

function construirQuery(params = {}) {

  const query = new URLSearchParams();

  Object.entries(params).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      query.append(clave, valor);
    }
  });

  const texto = query.toString();

  return texto ? `?${texto}` : "";
}

async function pedir(ruta, params) {

  const response =
    await fetch(
      `${API_URL}/api/reportes${ruta}${construirQuery(params)}`,
      { headers: obtenerHeaders() }
    );

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "No se pudo obtener el reporte"
    );
  }

  return data;
}

// =========================================================
// PANEL COMPLETO (resumen, ingresos, ranking y estados)
// ADMIN
// =========================================================
export function getDashboard(params) {
  return pedir("/dashboard", params);
}

// =========================================================
// MÉTRICAS INDIVIDUALES
// ADMIN
// =========================================================
export function getResumen(params) {
  return pedir("/resumen", params);
}

export function getIngresos(params) {
  return pedir("/ingresos", params);
}

export function getProductosTop(params) {
  return pedir("/productos-top", params);
}

export function getEstadosPedidos(params) {
  return pedir("/estados-pedidos", params);
}
