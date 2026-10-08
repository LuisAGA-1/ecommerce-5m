// =========================================================
// CASO DE USO / PUERTO DE ENTRADA: AnalyticsService
//
// Calcula las métricas del panel de administración:
//   - Volumen de ventas por producto (Top N)
//   - Ingresos totales por período (día / semana / mes)
//   - Distribución de pedidos por estado
//   - Ticket promedio por pedido y por cliente
//
// Depende SOLO del puerto AnalyticsRepository. Las sumas y
// conteos pesados llegan ya agregados desde la base de datos;
// aquí solo se hacen divisiones, porcentajes y comparaciones
// sobre unas cuantas filas.
// =========================================================
const FiltroReporte = require("../../domain/analytics/FiltroReporte");
const { CATEGORIAS, categoriaDeEstado } = require("../../domain/analytics/EstadosPedido");

const { ErrorFiltro } = FiltroReporte;

const LIMITE_POR_DEFECTO = 5;
const LIMITE_MAXIMO = 50;
const ORDENES = ["unidades", "ingresos"];

const dinero = n => Math.round(Number(n || 0) * 100) / 100;
const porcentaje = n => Math.round(Number(n || 0) * 10) / 10;

function dividir(a, b) {
  return Number(b) > 0 ? Number(a) / Number(b) : 0;
}

function variacion(actual, anterior) {
  if (!Number(anterior)) {
    return Number(actual) ? null : 0; // null = sin base de comparación
  }
  return porcentaje(((Number(actual) - Number(anterior)) / Number(anterior)) * 100);
}

class AnalyticsService {

  /**
   * @param {AnalyticsRepository} analyticsRepository  Puerto de salida
   * @param {() => Date} [reloj]                        Inyectable para pruebas
   */
  constructor(analyticsRepository, reloj = () => new Date()) {
    this.analyticsRepository = analyticsRepository;
    this.reloj = reloj;
  }

  crearFiltro(params = {}) {
    return new FiltroReporte(
      {
        desde: params.desde || undefined,
        hasta: params.hasta || undefined,
        granularidad: params.granularidad || undefined,
        base: params.base || undefined
      },
      this.reloj()
    );
  }

  describirRango(filtro) {
    return {
      desde: filtro.desde,
      hasta: filtro.hasta,
      dias: filtro.dias,
      granularidad: filtro.granularidad,
      base: filtro.base,
      estadosConsiderados: filtro.estados
    };
  }

  // =========================================================
  // RESUMEN + TICKET PROMEDIO
  // =========================================================
  async obtenerResumen(params) {
    const filtro = this.crearFiltro(params);
    return this.calcularResumen(filtro);
  }

  async calcularResumen(filtro, actualCrudo = null) {
    const anterior = filtro.periodoAnterior();

    const [actual, previo, clientesRegistrados] = await Promise.all([
      actualCrudo
        ? Promise.resolve(actualCrudo)
        : this.analyticsRepository.obtenerResumen(filtro),
      this.analyticsRepository.obtenerResumen(anterior),
      this.analyticsRepository.contarClientesRegistrados()
    ]);

    const construir = r => ({
      ingresos: dinero(r.ingresos),
      pedidos: Number(r.pedidos || 0),
      clientesCompradores: Number(r.clientes || 0),
      unidadesVendidas: Number(r.unidades || 0),
      ticketPromedioPedido: dinero(dividir(r.ingresos, r.pedidos)),
      ticketPromedioCliente: dinero(dividir(r.ingresos, r.clientes))
    });

    const a = construir(actual);
    const p = construir(previo);

    return {
      rango: this.describirRango(filtro),
      resumen: {
        ...a,
        clientesRegistrados: Number(clientesRegistrados || 0)
      },
      periodoAnterior: {
        desde: anterior.desde,
        hasta: anterior.hasta,
        ...p
      },
      variacion: {
        ingresos: variacion(a.ingresos, p.ingresos),
        pedidos: variacion(a.pedidos, p.pedidos),
        ticketPromedioPedido: variacion(a.ticketPromedioPedido, p.ticketPromedioPedido),
        ticketPromedioCliente: variacion(a.ticketPromedioCliente, p.ticketPromedioCliente)
      }
    };
  }

  // =========================================================
  // INGRESOS POR PERÍODO
  // =========================================================
  async obtenerIngresos(params) {
    const filtro = this.crearFiltro(params);
    return this.calcularIngresos(filtro);
  }

  async calcularIngresos(filtro) {
    const filas = await this.analyticsRepository.obtenerIngresosPorPeriodo(filtro);

    const serie = filas.map(f => ({
      periodo: String(f.periodo),
      ingresos: dinero(f.ingresos),
      pedidos: Number(f.pedidos || 0)
    }));

    const total = dinero(serie.reduce((s, f) => s + f.ingresos, 0));
    const mejor = serie.reduce(
      (max, f) => (f.ingresos > (max?.ingresos ?? -1) ? f : max),
      null
    );

    return {
      rango: this.describirRango(filtro),
      total,
      promedioPorPeriodo: dinero(dividir(total, serie.length)),
      mejorPeriodo: mejor && mejor.ingresos > 0 ? mejor : null,
      serie
    };
  }

  // =========================================================
  // PRODUCTOS MÁS VENDIDOS
  // =========================================================
  async obtenerProductosTop(params = {}) {
    const filtro = this.crearFiltro(params);
    return this.calcularProductosTop(filtro, params);
  }

  validarOpcionesRanking({ limite, ordenarPor } = {}) {
    const lim = limite === undefined || limite === "" ? LIMITE_POR_DEFECTO : Number(limite);

    if (!Number.isInteger(lim) || lim < 1 || lim > LIMITE_MAXIMO) {
      throw new ErrorFiltro(`"limite" debe ser un entero entre 1 y ${LIMITE_MAXIMO}`);
    }

    const orden = ordenarPor || "unidades";

    if (!ORDENES.includes(orden)) {
      throw new ErrorFiltro('"ordenarPor" debe ser "unidades" o "ingresos"');
    }

    return { limite: lim, ordenarPor: orden };
  }

  async calcularProductosTop(filtro, params = {}, resumenPrevio = null) {
    const opciones = this.validarOpcionesRanking(params);

    const [filas, resumen] = await Promise.all([
      this.analyticsRepository.obtenerProductosMasVendidos(filtro, opciones),
      resumenPrevio
        ? Promise.resolve(resumenPrevio)
        : this.analyticsRepository.obtenerResumen(filtro)
    ]);

    const totalUnidades = Number(resumen.unidades || 0);
    const totalIngresos = Number(resumen.ingresos || 0);

    return {
      rango: this.describirRango(filtro),
      ...opciones,
      productos: filas.map((f, i) => ({
        posicion: i + 1,
        productoId: Number(f.productoId),
        nombre: f.nombre,
        unidades: Number(f.unidades || 0),
        ingresos: dinero(f.ingresos),
        pedidos: Number(f.pedidos || 0),
        precioPromedio: dinero(dividir(f.ingresos, f.unidades)),
        participacionUnidades: porcentaje(dividir(f.unidades, totalUnidades) * 100),
        participacionIngresos: porcentaje(dividir(f.ingresos, totalIngresos) * 100)
      }))
    };
  }

  // =========================================================
  // DISTRIBUCIÓN POR ESTADO
  // (no aplica la base pagados/todos: cuenta todos los estados)
  // =========================================================
  async obtenerEstados(params) {
    const filtro = this.crearFiltro(params);
    return this.calcularEstados(filtro);
  }

  async calcularEstados(filtro) {
    const filas = await this.analyticsRepository.obtenerPedidosPorEstado(filtro);

    const acumulado = Object.fromEntries(
      CATEGORIAS.map(c => [c.clave, { cantidad: 0, monto: 0 }])
    );

    const otros = [];

    for (const fila of filas) {
      const categoria = categoriaDeEstado(fila.estado);
      if (categoria) {
        acumulado[categoria.clave].cantidad += Number(fila.cantidad || 0);
        acumulado[categoria.clave].monto += Number(fila.monto || 0);
      } else {
        otros.push(fila.estado);
      }
    }

    const total = Object.values(acumulado).reduce((s, x) => s + x.cantidad, 0);

    return {
      rango: this.describirRango(filtro),
      total,
      estados: CATEGORIAS.map(c => ({
        clave: c.clave,
        etiqueta: c.etiqueta,
        cantidad: acumulado[c.clave].cantidad,
        monto: dinero(acumulado[c.clave].monto),
        porcentaje: porcentaje(dividir(acumulado[c.clave].cantidad, total) * 100)
      })),
      ...(otros.length ? { estadosNoClasificados: otros } : {})
    };
  }

  // =========================================================
  // DASHBOARD COMPLETO (una sola petición para el panel)
  // =========================================================
  async obtenerDashboard(params = {}) {
    const filtro = this.crearFiltro(params);
    const opcionesRanking = this.validarOpcionesRanking(params);

    const resumenActualCrudo =
      await this.analyticsRepository.obtenerResumen(filtro);

    const [resumen, ingresos, productosTop, estados] = await Promise.all([
      this.calcularResumen(filtro, resumenActualCrudo),
      this.calcularIngresos(filtro),
      this.calcularProductosTop(filtro, opcionesRanking, resumenActualCrudo),
      this.calcularEstados(filtro)
    ]);

    return {
      rango: this.describirRango(filtro),
      resumen: resumen.resumen,
      periodoAnterior: resumen.periodoAnterior,
      variacion: resumen.variacion,
      ingresos: {
        total: ingresos.total,
        promedioPorPeriodo: ingresos.promedioPorPeriodo,
        mejorPeriodo: ingresos.mejorPeriodo,
        serie: ingresos.serie
      },
      productosTop: {
        limite: productosTop.limite,
        ordenarPor: productosTop.ordenarPor,
        productos: productosTop.productos
      },
      estados: {
        total: estados.total,
        estados: estados.estados
      },
      generadoEn: this.reloj().toISOString()
    };
  }
}

AnalyticsService.ErrorFiltro = ErrorFiltro;

module.exports = AnalyticsService;
