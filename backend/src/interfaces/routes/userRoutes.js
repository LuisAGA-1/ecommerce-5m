const express = require("express");

const {
  verificarToken,
  autorizarRoles
} = require("../middleware/authMiddleware");

function createUserRoutes(userController) {

  const router = express.Router();

  // =========================================
  // RUTAS EXCLUSIVAS DEL ADMINISTRADOR
  // =========================================

  // Crear usuario
  router.post(
    "/",
    verificarToken,
    autorizarRoles("admin"),
    userController.create.bind(userController)
  );

  // Obtener todos los usuarios
  router.get(
    "/",
    verificarToken,
    autorizarRoles("admin"),
    userController.getAll.bind(userController)
  );

  // Obtener usuario por ID
  router.get(
    "/:id",
    verificarToken,
    autorizarRoles("admin"),
    userController.getById.bind(userController)
  );

  // Actualizar usuario
  router.put(
    "/:id",
    verificarToken,
    autorizarRoles("admin"),
    userController.update.bind(userController)
  );

  // Eliminar usuario
  router.delete(
    "/:id",
    verificarToken,
    autorizarRoles("admin"),
    userController.delete.bind(userController)
  );

  return router;
}

module.exports = createUserRoutes;
