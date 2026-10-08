const crypto = require("crypto");

const { verificarToken } = require("./authMiddleware");

// =========================================================
// API KEY PARA INTEGRACIONES (n8n)
//
// n8n no puede iniciar sesión (el login exige CAPTCHA), así
// que las rutas de reportes aceptan, además del JWT de admin,
// el header:  X-API-Key: <REPORTES_API_KEY>
//
// - Si REPORTES_API_KEY no está definida, esta vía queda
//   desactivada y solo funciona el JWT.
// - La comparación es en tiempo constante (timingSafeEqual).
// - La clave solo da acceso de LECTURA a /api/reportes.
// =========================================================
function clavesIguales(a, b) {
  const hashA = crypto.createHash("sha256").update(String(a)).digest();
  const hashB = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function verificarTokenOApiKey(req, res, next) {

  const claveEsperada = process.env.REPORTES_API_KEY;
  const claveRecibida = req.headers["x-api-key"];

  if (claveRecibida === undefined) {
    return verificarToken(req, res, next);
  }

  if (!claveEsperada || claveEsperada.length < 24) {
    return res.status(401).json({
      mensaje: "El acceso por API key no está habilitado"
    });
  }

  if (!clavesIguales(claveRecibida, claveEsperada)) {
    return res.status(401).json({
      mensaje: "API key inválida"
    });
  }

  // Identidad de servicio con permisos de admin solo para reportes
  req.usuario = {
    id: null,
    nombre: "n8n",
    rol: "admin",
    servicio: true
  };

  next();
}

module.exports = {
  verificarTokenOApiKey
};
