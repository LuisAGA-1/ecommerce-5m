class OrderRepository {
  async create(order) {
    throw new Error("Método create no implementado");
  }

  async findAll() {
    throw new Error("Método findAll no implementado");
  }

  async findById(id) {
    throw new Error("Método findById no implementado");
  }

  async update(id, order) {
    throw new Error("Método update no implementado");
  }

  async delete(id) {
    throw new Error("Método delete no implementado");
  }
}

module.exports = OrderRepository;
