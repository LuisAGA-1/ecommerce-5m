// =========================================================
// CONTROLADOR: AnalyticsController
//
// Adaptador de entrada HTTP. Traduce query params a la
// llamada del caso de uso AnalyticsService y los errores
// de validación a 400. No contiene lógica de negocio.
// =========================================================
const AnalyticsService = require("../../application/analytics/AnalyticsService");

const { ErrorFiltro } = AnalyticsService;

function leerParametros(query = {}) {
  const { desde, hasta, granularidad, base, limite, ordenarPor } = query;
  return { desde, hasta, granularidad, base, limite, ordenarPor };
}

class AnalyticsController {

  constructor(analyticsService) {
    this.analyticsService = analyticsService;
  }

  async responder(res, accion) {
    try {
      const datos = await accion();
      res.set("Cache-Control", "no-store");
      res.json(datos);
    } catch (error) {
      if (error instanceof ErrorFiltro) {
        return res.status(400).json({ mensaje: error.message });
      }
      console.error("[reportes]", error);
      res.status(500).json({ mensaje: "Error al generar el reporte" });
    }
  }

  // GET /api/reportes/dashboard
  dashboard(req, res) {
    return this.responder(res, () =>
      this.analyticsService.obtenerDashboard(leerParametros(req.query))
    );
  }

  // GET /api/reportes/resumen
  resumen(req, res) {
    return this.responder(res, () =>
      this.analyticsService.obtenerResumen(leerParametros(req.query))
    );
  }

  // GET /api/reportes/ingresos
  ingresos(req, res) {
    return this.responder(res, () =>
      this.analyticsService.obtenerIngresos(leerParametros(req.query))
    );
  }

  // GET /api/reportes/productos-top
  productosTop(req, res) {
    return this.responder(res, () =>
      this.analyticsService.obtenerProductosTop(leerParametros(req.query))
    );
  }

  // GET /api/reportes/estados-pedidos
  estadosPedidos(req, res) {
    return this.responder(res, () =>
      this.analyticsService.obtenerEstados(leerParametros(req.query))
    );
  }
}

module.exports = AnalyticsController;
