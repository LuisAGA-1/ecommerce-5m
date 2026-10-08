const express = require("express");

const {
  autorizarRoles
} = require("../middleware/authMiddleware");

const {
  verificarTokenOApiKey
} = require("../middleware/apiKeyMiddleware");

// =========================================================
// RUTAS DE REPORTES ANALÍTICOS
// Montadas en /api/reportes. Solo ADMIN.
// Acceso: JWT de un usuario admin, o header X-API-Key
// (REPORTES_API_KEY) para integraciones como n8n.
// =========================================================
function createAnalyticsRoutes(analyticsController) {

  const router = express.Router();

  // Todas las rutas requieren (token o API key) y rol admin.
  router.use(verificarTokenOApiKey, autorizarRoles("admin"));

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
