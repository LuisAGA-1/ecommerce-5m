// =========================================================
// Catálogo de estados del pedido para reportes.
//
// En la base de datos el pedido usa PENDIENTE / ACEPTADO /
// RECHAZADO (y opcionalmente ENVIADO / CANCELADO). El panel
// analítico los agrupa en las 4 categorías de negocio que
// pide el reporte: Pendiente, Pagado, Enviado y Cancelado.
// =========================================================

const CATEGORIAS = [
  { clave: "PENDIENTE", etiqueta: "Pendiente", estadosBd: ["PENDIENTE"] },
  { clave: "PAGADO",    etiqueta: "Pagado",    estadosBd: ["ACEPTADO", "PAGADO"] },
  { clave: "ENVIADO",   etiqueta: "Enviado",   estadosBd: ["ENVIADO", "ENTREGADO"] },
  { clave: "CANCELADO", etiqueta: "Cancelado", estadosBd: ["RECHAZADO", "CANCELADO"] }
];

// Estados que cuentan como venta cobrada.
const ESTADOS_PAGADOS = Object.freeze(["ACEPTADO", "PAGADO", "ENVIADO", "ENTREGADO"]);

// Ventas registradas (todo excepto cancelado/rechazado).
const ESTADOS_NO_CANCELADOS = Object.freeze(["PENDIENTE", ...ESTADOS_PAGADOS]);

function categoriaDeEstado(estadoBd) {
  const estado = String(estadoBd || "").toUpperCase();
  return CATEGORIAS.find(c => c.estadosBd.includes(estado)) || null;
}

module.exports = {
  CATEGORIAS,
  ESTADOS_PAGADOS,
  ESTADOS_NO_CANCELADOS,
  categoriaDeEstado
};
