const express = require("express");

function createAuthRoutes(authController) {
  const router = express.Router();

  router.post(
    "/login",
    authController.login.bind(authController)
  );

  return router;
}

module.exports = createAuthRoutes;
