// =========================================================
// OBJETO DE VALOR: FiltroReporte
//
// Normaliza y valida los filtros de cualquier consulta
// analítica (rango de fechas, granularidad, base de cálculo).
// Es dominio puro: no conoce Express, SQL ni process.env.
// =========================================================
const {
  ESTADOS_PAGADOS,
  ESTADOS_NO_CANCELADOS
} = require("./EstadosPedido");

const GRANULARIDADES = {
  dia: "day",
  semana: "week",
  mes: "month"
};

const MAX_DIAS = 731;          // ~2 años por consulta
const DIAS_POR_DEFECTO = 30;

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

class ErrorFiltro extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ErrorFiltro";
  }
}

function aFecha(texto, campo) {
  if (!FORMATO_FECHA.test(texto)) {
    throw new ErrorFiltro(`El parámetro "${campo}" debe tener el formato AAAA-MM-DD`);
  }
  const fecha = new Date(`${texto}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== texto) {
    throw new ErrorFiltro(`El parámetro "${campo}" no es una fecha válida`);
  }
  return fecha;
}

function aTexto(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function sumarDias(fecha, dias) {
  const copia = new Date(fecha);
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

function diasEntre(desde, hasta) {
  return Math.round((hasta - desde) / 86400000) + 1;
}

class FiltroReporte {

  /**
   * @param {Object} params
   * @param {string} [params.desde]        AAAA-MM-DD (inclusive)
   * @param {string} [params.hasta]        AAAA-MM-DD (inclusive)
   * @param {string} [params.granularidad] dia | semana | mes
   * @param {string} [params.base]         pagados | todos
   * @param {Date}   [hoy]                 inyectable para pruebas
   */
  constructor(
    { desde, hasta, granularidad, base } = {},
    hoy = new Date()
  ) {

    const hoyUTC = aFecha(
      new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10),
      "hoy"
    );

    const fechaHasta = hasta ? aFecha(hasta, "hasta") : hoyUTC;
    const fechaDesde = desde
      ? aFecha(desde, "desde")
      : sumarDias(fechaHasta, -(DIAS_POR_DEFECTO - 1));

    if (fechaDesde > fechaHasta) {
      throw new ErrorFiltro('"desde" no puede ser posterior a "hasta"');
    }

    const dias = diasEntre(fechaDesde, fechaHasta);

    if (dias > MAX_DIAS) {
      throw new ErrorFiltro(`El rango máximo permitido es de ${MAX_DIAS} días`);
    }

    const gran = granularidad || FiltroReporte.granularidadSugerida(dias);

    if (!GRANULARIDADES[gran]) {
      throw new ErrorFiltro('La granularidad debe ser "dia", "semana" o "mes"');
    }

    const baseCalculo = base || "pagados";

    if (!["pagados", "todos"].includes(baseCalculo)) {
      throw new ErrorFiltro('La base debe ser "pagados" o "todos"');
    }

    this.desde = aTexto(fechaDesde);
    this.hasta = aTexto(fechaHasta);
    this.dias = dias;
    this.granularidad = gran;
    this.unidadSql = GRANULARIDADES[gran];
    this.base = baseCalculo;
    this.estados = baseCalculo === "pagados"
      ? [...ESTADOS_PAGADOS]
      : [...ESTADOS_NO_CANCELADOS];

    Object.freeze(this);
  }

  // Rango de igual duración inmediatamente anterior
  // (para calcular la variación porcentual).
  periodoAnterior() {
    const desde = aFecha(this.desde, "desde");
    const hastaAnterior = sumarDias(desde, -1);
    const desdeAnterior = sumarDias(hastaAnterior, -(this.dias - 1));
    return new FiltroReporte({
      desde: aTexto(desdeAnterior),
      hasta: aTexto(hastaAnterior),
      granularidad: this.granularidad,
      base: this.base
    });
  }

  static granularidadSugerida(dias) {
    if (dias <= 31) return "dia";
    if (dias <= 120) return "semana";
    return "mes";
  }
}

FiltroReporte.ErrorFiltro = ErrorFiltro;
FiltroReporte.GRANULARIDADES = Object.keys(GRANULARIDADES);

module.exports = FiltroReporte;
