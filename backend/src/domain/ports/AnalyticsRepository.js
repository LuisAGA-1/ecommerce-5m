// =========================================================
// PUERTO DE SALIDA: AnalyticsRepository
//
// Contrato de consultas analíticas (solo lectura).
// Está separado de OrderRepository / ProductRepository para
// no cargar a las entidades operativas con lógica de reportes
// (patrón CQRS ligero: comandos por un lado, consultas por otro).
//
// Toda agregación (SUM, COUNT, GROUP BY) debe resolverse en el
// motor de base de datos; el adaptador devuelve filas ya
// agregadas, nunca pedidos individuales.
//
// Cada método recibe un FiltroReporte con:
//   desde, hasta (AAAA-MM-DD), unidadSql (day|week|month),
//   estados (array de estados de BD a considerar)
// =========================================================
class AnalyticsRepository {

  /**
   * Totales del período.
   * @returns {Promise<{ pedidos:number, ingresos:number, clientes:number, unidades:number }>}
   */
  async obtenerResumen(filtro) {
    throw new Error("Método obtenerResumen no implementado");
  }

  /**
   * Ingresos agrupados por día/semana/mes, incluyendo períodos en cero.
   * @returns {Promise<Array<{ periodo:string, ingresos:number, pedidos:number }>>}
   */
  async obtenerIngresosPorPeriodo(filtro) {
    throw new Error("Método obtenerIngresosPorPeriodo no implementado");
  }

  /**
   * Ranking de productos.
   * @param {Object} opciones { limite:number, ordenarPor:'unidades'|'ingresos' }
   * @returns {Promise<Array<{ productoId:number, nombre:string, unidades:number, ingresos:number, pedidos:number }>>}
   */
  async obtenerProductosMasVendidos(filtro, opciones) {
    throw new Error("Método obtenerProductosMasVendidos no implementado");
  }

  /**
   * Conteo y monto por estado de BD (sin filtrar por estado).
   * @returns {Promise<Array<{ estado:string, cantidad:number, monto:number }>>}
   */
  async obtenerPedidosPorEstado(filtro) {
    throw new Error("Método obtenerPedidosPorEstado no implementado");
  }

  /**
   * Total de clientes registrados (entidad Usuario).
   * @returns {Promise<number>}
   */
  async contarClientesRegistrados() {
    throw new Error("Método contarClientesRegistrados no implementado");
  }
}

module.exports = AnalyticsRepository;
