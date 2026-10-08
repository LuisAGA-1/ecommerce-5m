// =========================================================
// ADAPTADOR DE SALIDA: AnalyticsRepositoryAdapter (PostgreSQL)
//
// Implementa el puerto AnalyticsRepository con consultas de
// solo lectura. Todas las métricas se agregan en el motor
// (SUM, COUNT, COUNT DISTINCT, GROUP BY, date_trunc,
// generate_series); Node.js solo recibe unas cuantas filas.
//
// Rango de fechas: [desde 00:00, hasta + 1 día 00:00)
// para que "hasta" sea inclusivo y se aprovechen índices
// sobre pedidos.fecha (ver docs/sql/indices-analitica.sql).
// =========================================================
const AnalyticsRepository = require("../../domain/ports/AnalyticsRepository");

// Filtro común: $1 = desde, $2 = hasta, $3 = estados
const FILTRO_PEDIDOS = `
      p.fecha >= $1::date
  AND p.fecha <  ($2::date + 1)
  AND p.estado::text = ANY($3::text[])`;

const ORDEN_RANKING = {
  unidades: "unidades DESC, ingresos DESC, pr.nombre ASC",
  ingresos: "ingresos DESC, unidades DESC, pr.nombre ASC"
};

class AnalyticsRepositoryAdapter extends AnalyticsRepository {

  /**
   * @param {{ query: Function }} [pool]  Pool de pg (inyectable en pruebas)
   */
  constructor(pool = null) {
    super();
    this.pool = pool;
  }

  db() {
    if (!this.pool) {
      this.pool = require("../database/db");
    }
    return this.pool;
  }

  // =========================================================
  // RESUMEN DEL PERÍODO
  // =========================================================
  async obtenerResumen(filtro) {
    const { rows } = await this.db().query(
      `WITH pedidos_filtrados AS (
         SELECT p.id, p.usuario_id, p.total
         FROM pedidos p
         WHERE ${FILTRO_PEDIDOS}
       )
       SELECT
         (SELECT COUNT(*) FROM pedidos_filtrados)::int                  AS pedidos,
         (SELECT COALESCE(SUM(total), 0) FROM pedidos_filtrados)        AS ingresos,
         (SELECT COUNT(DISTINCT usuario_id) FROM pedidos_filtrados)::int AS clientes,
         (SELECT COALESCE(SUM(d.cantidad), 0)
            FROM detalle_pedido d
            INNER JOIN pedidos_filtrados pf ON pf.id = d.pedido_id)::int AS unidades`,
      [filtro.desde, filtro.hasta, filtro.estados]
    );

    const r = rows[0] || {};

    return {
      pedidos: Number(r.pedidos || 0),
      ingresos: Number(r.ingresos || 0),
      clientes: Number(r.clientes || 0),
      unidades: Number(r.unidades || 0)
    };
  }

  // =========================================================
  // INGRESOS POR DÍA / SEMANA / MES
  // generate_series rellena los períodos sin ventas con 0
  // para que la gráfica muestre una línea de tiempo continua.
  // =========================================================
  async obtenerIngresosPorPeriodo(filtro) {
    const { rows } = await this.db().query(
      `WITH serie AS (
         SELECT generate_series(
                  date_trunc($4, $1::date::timestamp),
                  date_trunc($4, $2::date::timestamp),
                  ('1 ' || $4)::interval
                ) AS periodo
       ),
       ventas AS (
         SELECT
           date_trunc($4, p.fecha::timestamp) AS periodo,
           SUM(p.total)                      AS ingresos,
           COUNT(*)                          AS pedidos
         FROM pedidos p
         WHERE ${FILTRO_PEDIDOS}
         GROUP BY 1
       )
       SELECT
         to_char(s.periodo, 'YYYY-MM-DD')  AS periodo,
         COALESCE(v.ingresos, 0)           AS ingresos,
         COALESCE(v.pedidos, 0)::int       AS pedidos
       FROM serie s
       LEFT JOIN ventas v ON v.periodo = s.periodo
       ORDER BY s.periodo`,
      [filtro.desde, filtro.hasta, filtro.estados, filtro.unidadSql]
    );

    return rows.map(r => ({
      periodo: r.periodo,
      ingresos: Number(r.ingresos),
      pedidos: Number(r.pedidos)
    }));
  }

  // =========================================================
  // PRODUCTOS MÁS VENDIDOS
  // =========================================================
  async obtenerProductosMasVendidos(filtro, { limite, ordenarPor }) {
    // ordenarPor ya viene validado; además solo se usan
    // cláusulas fijas de ORDEN_RANKING (sin interpolar input).
    const orden = ORDEN_RANKING[ordenarPor] || ORDEN_RANKING.unidades;

    const { rows } = await this.db().query(
      `SELECT
         pr.id                                         AS producto_id,
         pr.nombre                                     AS nombre,
         SUM(d.cantidad)::int                          AS unidades,
         SUM(d.cantidad * d.precio_unitario)           AS ingresos,
         COUNT(DISTINCT d.pedido_id)::int              AS pedidos
       FROM detalle_pedido d
       INNER JOIN pedidos p    ON p.id  = d.pedido_id
       INNER JOIN productos pr ON pr.id = d.producto_id
       WHERE ${FILTRO_PEDIDOS}
       GROUP BY pr.id, pr.nombre
       ORDER BY ${orden}
       LIMIT $4`,
      [filtro.desde, filtro.hasta, filtro.estados, limite]
    );

    return rows.map(r => ({
      productoId: Number(r.producto_id),
      nombre: r.nombre,
      unidades: Number(r.unidades),
      ingresos: Number(r.ingresos),
      pedidos: Number(r.pedidos)
    }));
  }

  // =========================================================
  // PEDIDOS POR ESTADO (todos los estados del rango)
  // =========================================================
  async obtenerPedidosPorEstado(filtro) {
    const { rows } = await this.db().query(
      `SELECT
         p.estado::text            AS estado,
         COUNT(*)::int             AS cantidad,
         COALESCE(SUM(p.total), 0) AS monto
       FROM pedidos p
       WHERE p.fecha >= $1::date
         AND p.fecha <  ($2::date + 1)
       GROUP BY p.estado
       ORDER BY cantidad DESC`,
      [filtro.desde, filtro.hasta]
    );

    return rows.map(r => ({
      estado: r.estado,
      cantidad: Number(r.cantidad),
      monto: Number(r.monto)
    }));
  }

  // =========================================================
  // CLIENTES REGISTRADOS (entidad Usuario)
  // =========================================================
  async contarClientesRegistrados() {
    const { rows } = await this.db().query(
      `SELECT COUNT(*)::int AS total
       FROM usuarios
       WHERE rol = 'cliente'`
    );

    return Number(rows[0]?.total || 0);
  }
}

module.exports = AnalyticsRepositoryAdapter;
