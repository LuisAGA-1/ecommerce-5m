import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { login } from "../services/authService";

function Login({ onLogin }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarLogin(event) {

    event.preventDefault();

    setError("");

    if (!captchaToken) {
      setError(
        "Debes completar el CAPTCHA"
      );
      return;
    }

    setCargando(true);

    try {

      const resultado =
        await login(
          email,
          password,
          captchaToken
        );

      localStorage.setItem(
        "token",
        resultado.token
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(
          resultado.usuario
        )
      );

      onLogin(
        resultado.usuario
      );

    } catch (error) {

      setError(
        error.message
      );

      setCaptchaToken("");

    } finally {

      setCargando(false);
    }
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          EC
        </div>

        <h1>
          E-Commerce
        </h1>

        <p className="login-subtitle">
          Inicia sesión para continuar
        </p>

        <form
          onSubmit={manejarLogin}
        >

          <div className="form-group">

            <label>
              Correo electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="correo@ejemplo.com"
              required
            />

          </div>

          <div className="form-group">

            <label>
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Ingresa tu contraseña"
              required
            />

          </div>

          <div className="login-captcha">

            <Turnstile
              siteKey={
                import.meta.env
                  .VITE_TURNSTILE_SITE_KEY
              }
              onSuccess={(
                token
              ) =>
                setCaptchaToken(
                  token
                )
              }
              onExpire={() =>
                setCaptchaToken("")
              }
              onError={() =>
                setCaptchaToken("")
              }
            />

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={
              cargando ||
              !captchaToken
            }
          >
            {cargando
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;

