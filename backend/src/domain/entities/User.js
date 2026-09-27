class User {
  constructor({ id = null, nombre, email, passwordHash, rol = "cliente" }) {
    if (!nombre || nombre.trim() === "") {
      throw new Error("El nombre es obligatorio");
    }

    if (!email || email.trim() === "") {
      throw new Error("El email es obligatorio");
    }

    if (!passwordHash || passwordHash.trim() === "") {
      throw new Error("La contraseña es obligatoria");
    }

    if (!["cliente", "admin"].includes(rol)) {
      throw new Error("El rol no es válido");
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.email = email.trim().toLowerCase();
    this.passwordHash = passwordHash;
    this.rol = rol;
  }
}

module.exports = User;
