const express = require("express");

const {
  verificarToken,
  autorizarRoles
} = require("../middleware/authMiddleware");

function createOrderRoutes(orderController) {

  const router = express.Router();

  // =======================================================
  // CLIENTE
  // Crear pedido
  // =======================================================
  router.post(
    "/",
    verificarToken,
    autorizarRoles("cliente"),
    orderController.create.bind(orderController)
  );

  // =======================================================
  // CLIENTE
  // Ver sus propios pedidos
  //
  // IMPORTANTE:
  // Esta ruta debe estar antes de /:id
  // =======================================================
  router.get(
    "/mis-pedidos",
    verificarToken,
    autorizarRoles("cliente"),
    orderController.getMyOrders.bind(orderController)
  );

  // =======================================================
  // ADMIN
  // Ver todos los pedidos
  // =======================================================
  router.get(
    "/",
    verificarToken,
    autorizarRoles("admin"),
    orderController.getAll.bind(orderController)
  );

  // =======================================================
  // ADMIN
  // Aceptar pedido
  // =======================================================
  router.patch(
    "/:id/aceptar",
    verificarToken,
    autorizarRoles("admin"),
    orderController.accept.bind(orderController)
  );

  // =======================================================
  // ADMIN
  // Rechazar pedido
  // =======================================================
  router.patch(
    "/:id/rechazar",
    verificarToken,
    autorizarRoles("admin"),
    orderController.reject.bind(orderController)
  );

  // =======================================================
  // ADMIN
  // Ver pedido individual
  // =======================================================
  router.get(
    "/:id",
    verificarToken,
    autorizarRoles("admin"),
    orderController.getById.bind(orderController)
  );

  // =======================================================
  // ADMIN
  // Actualizar pedido
  // =======================================================
  router.put(
    "/:id",
    verificarToken,
    autorizarRoles("admin"),
    orderController.update.bind(orderController)
  );

  // =======================================================
  // ADMIN
  // Eliminar pedido
  // =======================================================
  router.delete(
    "/:id",
    verificarToken,
    autorizarRoles("admin"),
    orderController.delete.bind(orderController)
  );

  return router;
}

module.exports = createOrderRoutes;
