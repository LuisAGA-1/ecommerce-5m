const express = require("express");

const {
  verificarToken,
  autorizarRoles
} = require("../middleware/authMiddleware");

// =========================================================
// RUTAS DE REPORTES ANALÍTICOS
// Montadas en /api/reportes. Solo ADMIN.
// =========================================================
function createAnalyticsRoutes(analyticsController) {

  const router = express.Router();

  // Todas las rutas requieren token y rol admin.
  router.use(verificarToken, autorizarRoles("admin"));

  // Panel completo en una sola petición
  router.get("/dashboard", analyticsController.dashboard.bind(analyticsController));

  // Métricas individuales
  router.get("/resumen", analyticsController.resumen.bind(analyticsController));
  router.get("/ingresos", analyticsController.ingresos.bind(analyticsController));
  router.get("/productos-top", analyticsController.productosTop.bind(analyticsController));
  router.get("/estados-pedidos", analyticsController.estadosPedidos.bind(analyticsController));

  return router;
}

module.exports = createAnalyticsRoutes;
