const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

class AuthService {

  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async verificarCaptcha(captchaToken) {

    if (!captchaToken) {
      throw new Error(
        "Debes completar el CAPTCHA"
      );
    }

    try {

      const respuesta =
        await axios.post(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          new URLSearchParams({
            secret:
              process.env.TURNSTILE_SECRET_KEY,
            response:
              captchaToken
          }).toString(),
          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded"
            }
          }
        );

      if (!respuesta.data.success) {
        throw new Error(
          "CAPTCHA inválido"
        );
      }

    } catch (error) {

      if (
        error.message ===
        "CAPTCHA inválido"
      ) {
        throw error;
      }

      console.error(
        "Error verificando CAPTCHA:",
        error.message
      );

      throw new Error(
        "No se pudo verificar el CAPTCHA"
      );
    }
  }

  async login(
    email,
    password,
    captchaToken
  ) {

    await this.verificarCaptcha(
      captchaToken
    );

    if (!email || !password) {
      throw new Error(
        "El email y la contraseña son obligatorios"
      );
    }

    const user =
      await this.userRepository.findByEmail(
        email.trim().toLowerCase()
      );

    if (!user) {
      throw new Error(
        "Credenciales incorrectas"
      );
    }

    const passwordCorrecta =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordCorrecta) {
      throw new Error(
        "Credenciales incorrectas"
      );
    }

    const token =
      jwt.sign(
        {
          id: user.id,
          email: user.email,
          rol: user.rol
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h"
        }
      );

    return {
      token,

      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    };
  }
}

module.exports = AuthService;
