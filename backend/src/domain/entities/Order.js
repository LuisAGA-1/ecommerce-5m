class Order {
  constructor({
    id = null,
    usuarioId,
    fecha = null,
    total = 0,
    detalles = []
  }) {
    if (!usuarioId) {
      throw new Error("El usuario es obligatorio");
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      throw new Error("El pedido debe tener al menos un producto");
    }

    this.id = id;
    this.usuarioId = Number(usuarioId);
    this.fecha = fecha;
    this.total = Number(total);
    this.detalles = detalles;
  }

  calcularTotal() {
    this.total = this.detalles.reduce(
      (total, detalle) =>
        total + Number(detalle.precioUnitario) * Number(detalle.cantidad),
      0
    );

    return this.total;
  }
}

module.exports = Order;

