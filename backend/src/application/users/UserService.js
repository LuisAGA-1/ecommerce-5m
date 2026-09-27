const bcrypt = require("bcryptjs");

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async createUser({
    nombre,
    email,
    password,
    rol = "cliente"
  }) {
    if (!nombre || !email || !password) {
      throw new Error(
        "Faltan datos obligatorios"
      );
    }

    if (password.length < 6) {
      throw new Error(
        "La contraseña debe tener al menos 6 caracteres"
      );
    }

    const emailNormalizado =
      email.trim().toLowerCase();

    const existingUser =
      await this.userRepository.findByEmail(
        emailNormalizado
      );

    if (existingUser) {
      throw new Error(
        "El correo ya existe"
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const user = {
      nombre: nombre.trim(),
      email: emailNormalizado,
      passwordHash,
      rol: rol || "cliente"
    };

    return await this.userRepository.create(
      user
    );
  }

  async getUsers() {
    return await this.userRepository.findAll();
  }

  async getUserById(id) {
    const user =
      await this.userRepository.findById(id);

    if (!user) {
      throw new Error(
        "Usuario no encontrado"
      );
    }

    return user;
  }

  async updateUser(
    id,
    {
      nombre,
      email,
      password,
      rol
    }
  ) {
    if (!nombre || !email || !password) {
      throw new Error(
        "Faltan datos obligatorios"
      );
    }

    if (password.length < 6) {
      throw new Error(
        "La contraseña debe tener al menos 6 caracteres"
      );
    }

    const existingUser =
      await this.userRepository.findById(id);

    if (!existingUser) {
      throw new Error(
        "Usuario no encontrado"
      );
    }

    const emailNormalizado =
      email.trim().toLowerCase();

    const emailUser =
      await this.userRepository.findByEmail(
        emailNormalizado
      );

    if (
      emailUser &&
      emailUser.id !== Number(id)
    ) {
      throw new Error(
        "El correo ya existe"
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const user = {
      nombre: nombre.trim(),
      email: emailNormalizado,
      passwordHash,
      rol: rol || existingUser.rol
    };

    return await this.userRepository.update(
      id,
      user
    );
  }

  async deleteUser(id) {
    const existingUser =
      await this.userRepository.findById(id);

    if (!existingUser) {
      throw new Error(
        "Usuario no encontrado"
      );
    }

    await this.userRepository.delete(id);

    return {
      mensaje:
        "Usuario eliminado correctamente"
    };
  }
}

module.exports = UserService;
