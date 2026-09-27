const express = require("express");

const {
  verificarToken,
  autorizarRoles
} = require("../middleware/authMiddleware");

function createProductRoutes(productController) {

  const router = express.Router();

  // =========================================================
  // PRODUCTOS PUBLICADOS
  // Cliente puede consultar los productos disponibles
  // =========================================================
  router.get(
    "/publicados",
    productController.getPublished.bind(productController)
  );

  // =========================================================
  // MIS PRODUCTOS
  // Solo proveedor
  // =========================================================
  router.get(
    "/mis-productos",
    verificarToken,
    autorizarRoles("proveedor"),
    productController.getMine.bind(productController)
  );

  // =========================================================
  // TODOS LOS PRODUCTOS
  // Solo administrador
  // =========================================================
  router.get(
    "/",
    verificarToken,
    autorizarRoles("admin"),
    productController.getAll.bind(productController)
  );

  // =========================================================
  // CREAR PRODUCTO
  // Proveedor o administrador
  // =========================================================
  router.post(
    "/",
    verificarToken,
    autorizarRoles("proveedor", "admin"),
    productController.create.bind(productController)
  );

  // =========================================================
  // PUBLICAR PRODUCTO
  // Solo proveedor
  // =========================================================
  router.patch(
    "/:id/publicar",
    verificarToken,
    autorizarRoles("proveedor"),
    productController.publish.bind(productController)
  );

  // =========================================================
  // DESPUBLICAR PRODUCTO
  // Solo proveedor
  // =========================================================
  router.patch(
    "/:id/despublicar",
    verificarToken,
    autorizarRoles("proveedor"),
    productController.unpublish.bind(productController)
  );

  // =========================================================
  // ACTUALIZAR PRODUCTO
  // Proveedor o administrador
  // =========================================================
  router.put(
    "/:id",
    verificarToken,
    autorizarRoles("proveedor", "admin"),
    productController.update.bind(productController)
  );

  // =========================================================
  // ELIMINAR PRODUCTO
  // Proveedor o administrador
  // =========================================================
  router.delete(
    "/:id",
    verificarToken,
    autorizarRoles("proveedor", "admin"),
    productController.delete.bind(productController)
  );

  // =========================================================
  // OBTENER PRODUCTO POR ID
  // =========================================================
  router.get(
    "/:id",
    productController.getById.bind(productController)
  );

  return router;
}

module.exports = createProductRoutes;
