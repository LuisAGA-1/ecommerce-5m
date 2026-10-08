// =========================================================
// Pruebas del subsistema analítico
//
//   npm test
//
// AnalyticsService se prueba con un repositorio falso en
// memoria: demuestra que el caso de uso depende solo del
// puerto AnalyticsRepository y no de PostgreSQL.
// =========================================================
const { test } = require("node:test");
const assert = require("node:assert/strict");

const AnalyticsService = require("../src/application/analytics/AnalyticsService");
const AnalyticsRepository = require("../src/domain/ports/AnalyticsRepository");
const FiltroReporte = require("../src/domain/analytics/FiltroReporte");

const HOY = new Date("2026-10-08T12:00:00");
const reloj = () => HOY;

class RepositorioFalso extends AnalyticsRepository {
  constructor({ resumenes = {}, serie = [], productos = [], estados = [], clientes = 0 } = {}) {
    super();
    this.resumenes = resumenes;
    this.serie = serie;
    this.productos = productos;
    this.estados = estados;
    this.clientes = clientes;
    this.llamadas = [];
  }
  async obtenerResumen(f) {
    this.llamadas.push(["resumen", f.desde, f.hasta, f.estados]);
    return this.resumenes[`${f.desde}|${f.hasta}`] || { pedidos: 0, ingresos: 0, clientes: 0, unidades: 0 };
  }
  async obtenerIngresosPorPeriodo(f) {
    this.llamadas.push(["ingresos", f.unidadSql]);
    return this.serie;
  }
  async obtenerProductosMasVendidos(f, opciones) {
    this.llamadas.push(["productos", opciones]);
    return this.productos.slice(0, opciones.limite);
  }
  async obtenerPedidosPorEstado() {
    return this.estados;
  }
  async contarClientesRegistrados() {
    return this.clientes;
  }
}

// ---------------------------------------------------------
// FiltroReporte (dominio)
// ---------------------------------------------------------
test("sin fechas usa los últimos 30 días y granularidad diaria", () => {
  const f = new FiltroReporte({}, HOY);
  assert.equal(f.hasta, "2026-10-08");
  assert.equal(f.desde, "2026-09-09");
  assert.equal(f.dias, 30);
  assert.equal(f.granularidad, "dia");
  assert.equal(f.base, "pagados");
  assert.deepEqual(f.estados, ["ACEPTADO", "PAGADO", "ENVIADO", "ENTREGADO"]);
});

test("sugiere semana o mes según la longitud del rango", () => {
  assert.equal(new FiltroReporte({ desde: "2026-07-01", hasta: "2026-09-30" }, HOY).granularidad, "semana");
  assert.equal(new FiltroReporte({ desde: "2026-01-01", hasta: "2026-09-30" }, HOY).granularidad, "mes");
});

test("base 'todos' incluye pendientes y excluye cancelados", () => {
  const f = new FiltroReporte({ base: "todos" }, HOY);
  assert.ok(f.estados.includes("PENDIENTE"));
  assert.ok(!f.estados.includes("RECHAZADO"));
});

test("el período anterior tiene la misma duración y termina un día antes", () => {
  const f = new FiltroReporte({ desde: "2026-09-01", hasta: "2026-09-30" }, HOY);
  const a = f.periodoAnterior();
  assert.equal(a.hasta, "2026-08-31");
  assert.equal(a.desde, "2026-08-02");
  assert.equal(a.dias, 30);
});

test("rechaza filtros inválidos con ErrorFiltro", () => {
  const casos = [
    { desde: "2026-02-30" },
    { desde: "08/10/2026" },
    { desde: "2026-10-05", hasta: "2026-10-01" },
    { granularidad: "hora" },
    { base: "otro" },
    { desde: "2020-01-01", hasta: "2026-01-01" }
  ];
  for (const c of casos) {
    assert.throws(() => new FiltroReporte(c, HOY), FiltroReporte.ErrorFiltro, JSON.stringify(c));
  }
});

// ---------------------------------------------------------
// AnalyticsService (caso de uso)
// ---------------------------------------------------------
test("calcula tickets promedio y variación contra el período anterior", async () => {
  const repo = new RepositorioFalso({
    resumenes: {
      "2026-09-01|2026-09-30": { pedidos: 4, ingresos: 1000, clientes: 2, unidades: 10 },
      "2026-08-02|2026-08-31": { pedidos: 2, ingresos: 800, clientes: 2, unidades: 5 }
    },
    clientes: 15
  });
  const svc = new AnalyticsService(repo, reloj);

  const r = await svc.obtenerResumen({ desde: "2026-09-01", hasta: "2026-09-30" });

  assert.equal(r.resumen.ticketPromedioPedido, 250);
  assert.equal(r.resumen.ticketPromedioCliente, 500);
  assert.equal(r.resumen.clientesRegistrados, 15);
  assert.equal(r.variacion.ingresos, 25);
  assert.equal(r.variacion.pedidos, 100);
  assert.equal(r.periodoAnterior.desde, "2026-08-02");
});

test("sin pedidos los tickets son 0 y la variación no divide entre cero", async () => {
  const svc = new AnalyticsService(new RepositorioFalso(), reloj);
  const r = await svc.obtenerResumen({});
  assert.equal(r.resumen.ticketPromedioPedido, 0);
  assert.equal(r.resumen.ticketPromedioCliente, 0);
  assert.equal(r.variacion.ingresos, 0);
});

test("crecer desde cero devuelve variación null (sin base de comparación)", async () => {
  const repo = new RepositorioFalso({
    resumenes: { "2026-09-09|2026-10-08": { pedidos: 1, ingresos: 100, clientes: 1, unidades: 1 } }
  });
  const r = await new AnalyticsService(repo, reloj).obtenerResumen({});
  assert.equal(r.variacion.ingresos, null);
});

test("agrupa estados de BD en Pendiente/Pagado/Enviado/Cancelado con porcentajes", async () => {
  const repo = new RepositorioFalso({
    estados: [
      { estado: "ACEPTADO", cantidad: 6, monto: 600 },
      { estado: "PENDIENTE", cantidad: 2, monto: 200 },
      { estado: "RECHAZADO", cantidad: 1, monto: 50 },
      { estado: "ENVIADO", cantidad: 1, monto: 100 }
    ]
  });
  const r = await new AnalyticsService(repo, reloj).obtenerEstados({});

  assert.equal(r.total, 10);
  assert.deepEqual(r.estados.map(e => e.etiqueta), ["Pendiente", "Pagado", "Enviado", "Cancelado"]);
  assert.deepEqual(r.estados.map(e => e.porcentaje), [20, 60, 10, 10]);
  assert.equal(r.estados.reduce((s, e) => s + e.porcentaje, 0), 100);
});

test("el ranking respeta el límite y calcula participación y precio promedio", async () => {
  const repo = new RepositorioFalso({
    resumenes: { "2026-09-09|2026-10-08": { pedidos: 5, ingresos: 1000, clientes: 3, unidades: 20 } },
    productos: [
      { productoId: 1, nombre: "A", unidades: 10, ingresos: 500, pedidos: 4 },
      { productoId: 2, nombre: "B", unidades: 6, ingresos: 300, pedidos: 3 },
      { productoId: 3, nombre: "C", unidades: 4, ingresos: 200, pedidos: 2 }
    ]
  });
  const r = await new AnalyticsService(repo, reloj).obtenerProductosTop({ limite: "2", ordenarPor: "ingresos" });

  assert.equal(r.productos.length, 2);
  assert.equal(r.ordenarPor, "ingresos");
  assert.equal(r.productos[0].posicion, 1);
  assert.equal(r.productos[0].participacionUnidades, 50);
  assert.equal(r.productos[0].participacionIngresos, 50);
  assert.equal(r.productos[1].precioPromedio, 50);
  assert.deepEqual(repo.llamadas.find(l => l[0] === "productos")[1], { limite: 2, ordenarPor: "ingresos" });
});

test("valida límite y orden del ranking", async () => {
  const svc = new AnalyticsService(new RepositorioFalso(), reloj);
  await assert.rejects(() => svc.obtenerProductosTop({ limite: "0" }), AnalyticsService.ErrorFiltro);
  await assert.rejects(() => svc.obtenerProductosTop({ limite: "abc" }), AnalyticsService.ErrorFiltro);
  await assert.rejects(() => svc.obtenerProductosTop({ ordenarPor: "nombre" }), AnalyticsService.ErrorFiltro);
});

test("la serie de ingresos reporta total, promedio y mejor período", async () => {
  const repo = new RepositorioFalso({
    serie: [
      { periodo: "2026-09-01", ingresos: 100, pedidos: 1 },
      { periodo: "2026-09-08", ingresos: 0, pedidos: 0 },
      { periodo: "2026-09-15", ingresos: 350.555, pedidos: 2 }
    ]
  });
  const r = await new AnalyticsService(repo, reloj).obtenerIngresos({ granularidad: "semana" });

  assert.equal(r.total, 450.56);
  assert.equal(r.promedioPorPeriodo, 150.19);
  assert.equal(r.mejorPeriodo.periodo, "2026-09-15");
  assert.equal(repo.llamadas[0][1], "week");
});

test("el dashboard reúne todas las métricas en una respuesta", async () => {
  const repo = new RepositorioFalso({
    resumenes: { "2026-09-09|2026-10-08": { pedidos: 2, ingresos: 300, clientes: 1, unidades: 3 } },
    serie: [{ periodo: "2026-10-01", ingresos: 300, pedidos: 2 }],
    productos: [{ productoId: 1, nombre: "A", unidades: 3, ingresos: 300, pedidos: 2 }],
    estados: [{ estado: "ACEPTADO", cantidad: 2, monto: 300 }],
    clientes: 4
  });
  const d = await new AnalyticsService(repo, reloj).obtenerDashboard({});

  assert.ok(d.rango && d.resumen && d.variacion && d.ingresos && d.productosTop && d.estados);
  assert.equal(d.resumen.ticketPromedioPedido, 150);
  assert.equal(d.productosTop.productos[0].participacionIngresos, 100);
  assert.equal(d.estados.estados.find(e => e.clave === "PAGADO").porcentaje, 100);
});
