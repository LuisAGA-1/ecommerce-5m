class AuthController {

  constructor(authService) {
    this.authService = authService;
  }

  async login(req, res) {

    try {

      const {
        email,
        password,
        captchaToken
      } = req.body;

      const resultado =
        await this.authService.login(
          email,
          password,
          captchaToken
        );

      res.json(resultado);

    } catch (error) {

      if (
        error.message ===
          "El email y la contraseña son obligatorios" ||
        error.message ===
          "Credenciales incorrectas" ||
        error.message ===
          "Debes completar el CAPTCHA" ||
        error.message ===
          "CAPTCHA inválido" ||
        error.message ===
          "No se pudo verificar el CAPTCHA"
      ) {

        return res.status(401).json({
          mensaje: error.message
        });
      }

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }
}

module.exports = AuthController;
