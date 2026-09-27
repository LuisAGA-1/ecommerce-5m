class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  async create(req, res) {
    try {
      const user = await this.userService.createUser(req.body);

      res.status(201).json(user);
    } catch (error) {
      if (error.message === "Faltan datos obligatorios") {
        return res.status(400).json({ mensaje: error.message });
      }

      if (error.message === "La contraseña debe tener al menos 6 caracteres") {
        return res.status(400).json({ mensaje: error.message });
      }

      if (error.message === "El correo ya existe") {
        return res.status(409).json({ mensaje: error.message });
      }

      console.error(error);
      res.status(500).json({ mensaje: "Error del servidor" });
    }
  }

  async getAll(req, res) {
    try {
      const users = await this.userService.getUsers();

      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error del servidor" });
    }
  }

  async getById(req, res) {
    try {
      const user = await this.userService.getUserById(req.params.id);

      res.json(user);
    } catch (error) {
      if (error.message === "Usuario no encontrado") {
        return res.status(404).json({ mensaje: error.message });
      }

      console.error(error);
      res.status(500).json({ mensaje: "Error del servidor" });
    }
  }

  async update(req, res) {
    try {
      const user = await this.userService.updateUser(
        req.params.id,
        req.body
      );

      res.json(user);
    } catch (error) {
      if (
        error.message === "Faltan datos obligatorios" ||
        error.message === "La contraseña debe tener al menos 6 caracteres"
      ) {
        return res.status(400).json({ mensaje: error.message });
      }

      if (error.message === "Usuario no encontrado") {
        return res.status(404).json({ mensaje: error.message });
      }

      if (error.message === "El correo ya existe") {
        return res.status(409).json({ mensaje: error.message });
      }

      console.error(error);
      res.status(500).json({ mensaje: "Error del servidor" });
    }
  }

  async delete(req, res) {
    try {
      const result = await this.userService.deleteUser(req.params.id);

      res.json(result);
    } catch (error) {
      if (error.message === "Usuario no encontrado") {
        return res.status(404).json({ mensaje: error.message });
      }

      console.error(error);
      res.status(500).json({ mensaje: "Error del servidor" });
    }
  }
}

module.exports = UserController;
