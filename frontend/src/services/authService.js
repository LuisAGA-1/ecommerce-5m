const API_URL = "http://localhost:3000";

export async function login(
  email,
  password,
  captchaToken
) {

  const response =
    await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          email,
          password,
          captchaToken
        })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      "Error al iniciar sesión"
    );
  }

  return data;
}
