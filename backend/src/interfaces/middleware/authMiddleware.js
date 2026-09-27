const jwt = require("jsonwebtoken");

// =========================================================
// VERIFICAR TOKEN JWT
// =========================================================
function verificarToken(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      mensaje: "Token requerido"
    });
  }

  const partes = authHeader.split(" ");

  if (
    partes.length !== 2 ||
    partes[0] !== "Bearer"
  ) {
    return res.status(401).json({
      mensaje: "Formato de token inválido"
    });
  }

  const token = partes[1];

  try {

    const usuario = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = usuario;

    next();

  } catch (error) {

    return res.status(401).json({
      mensaje: "Token inválido o expirado"
    });
  }
}

// =========================================================
// AUTORIZAR ROLES
// =========================================================
function autorizarRoles(...rolesPermitidos) {

  return (req, res, next) => {

    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado"
      });
    }

    if (
      !rolesPermitidos.includes(
        req.usuario.rol
      )
    ) {
      return res.status(403).json({
        mensaje: "No tienes permisos para realizar esta acción"
      });
    }

    next();
  };
}

module.exports = {
  verificarToken,
  autorizarRoles
};
