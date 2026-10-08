const Order = require("../../domain/entities/Order");

class OrderService {

  /**
   * @param {OrderRepository}   orderRepository
   * @param {UserRepository}    userRepository
   * @param {ProductRepository} productRepository
   * @param {EmailServicePort}  [emailService]  Puerto de salida para
   *        notificaciones. Es opcional: si no se inyecta, el pedido
   *        se crea igual, solo que sin enviar correos.
   */
  constructor(
    orderRepository,
    userRepository,
    productRepository,
    emailService = null
  ) {
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
    this.productRepository = productRepository;
    this.emailService = emailService;
  }

  // =========================================================
  // NOTIFICAR PEDIDO (usa el puerto EmailServicePort)
  //
  // El núcleo solo invoca métodos del puerto; no sabe qué
  // librería ni qué proveedor envía el correo. Un fallo en el
  // envío NO revierte el pedido: se registra y se informa.
  // =========================================================
  async notificarPedido(pedido, cliente) {

    if (!this.emailService) {
      return {
        cliente: { enviado: false, motivo: "Servicio de correo no configurado" },
        admin: { enviado: false, motivo: "Servicio de correo no configurado" }
      };
    }

    const [cliRes, admRes] = await Promise.allSettled([
      this.emailService.enviarComprobantePedido({ pedido, cliente }),
      this.emailService.notificarNuevoPedidoAdmin({ pedido, cliente })
    ]);

    const resultado = r =>
      r.status === "fulfilled"
        ? r.value
        : { enviado: false, motivo: r.reason?.message || "Error al enviar" };

    if (cliRes.status === "rejected") {
      console.error("[pedido] No se envió el comprobante al cliente:", cliRes.reason);
    }

    if (admRes.status === "rejected") {
      console.error("[pedido] No se notificó al administrador:", admRes.reason);
    }

    return {
      cliente: resultado(cliRes),
      admin: resultado(admRes)
    };
  }

  // =========================================================
  // CREAR PEDIDO
  // =========================================================
  async createOrder({ usuarioId, detalles }) {

    const user =
      await this.userRepository.findById(usuarioId);

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      throw new Error(
        "El pedido debe tener al menos un producto"
      );
    }

    const detallesProcesados = [];

    for (const detalle of detalles) {

      if (!detalle.productoId || !detalle.cantidad) {
        throw new Error(
          "Los datos del detalle son obligatorios"
        );
      }

      if (
        !Number.isInteger(Number(detalle.cantidad)) ||
        Number(detalle.cantidad) <= 0
      ) {
        throw new Error(
          "La cantidad debe ser un entero mayor que 0"
        );
      }

      const product =
        await this.productRepository.findById(
          detalle.productoId
        );

      if (!product) {
        throw new Error(
          "Producto no encontrado"
        );
      }

      // El stock se verifica al crear el pedido,
      // pero NO se descuenta todavía.
      if (
        Number(product.stock) <
        Number(detalle.cantidad)
      ) {
        throw new Error(
          `Stock insuficiente para el producto: ${product.nombre}`
        );
      }

      detallesProcesados.push({
        productoId: product.id,
        cantidad: Number(detalle.cantidad),
        precioUnitario: Number(product.precio)
      });
    }

    const order = new Order({
      usuarioId,
      detalles: detallesProcesados
    });

    // Calculamos el total usando el precio actual
    // de los productos.
    order.calcularTotal();

    // El repositorio crea el pedido como PENDIENTE (de pago).
    const pedidoCreado =
      await this.orderRepository.create(order);

    // Disparar notificaciones por el puerto de salida.
    const notificacion = await this.notificarPedido(
      pedidoCreado,
      {
        id: user.id,
        nombre: user.nombre,
        email: user.email
      }
    );

    return {
      ...pedidoCreado,
      notificacion
    };
  }

  // =========================================================
  // OBTENER TODOS LOS PEDIDOS
  // =========================================================
  async getOrders() {

    return await this.orderRepository.findAll();
  }

  // =========================================================
  // OBTENER PEDIDO POR ID
  // =========================================================
  async getOrderById(id) {

    const order =
      await this.orderRepository.findById(id);

    if (!order) {
      throw new Error(
        "Pedido no encontrado"
      );
    }

    return order;
  }

  // =========================================================
  // OBTENER PEDIDOS DE UN CLIENTE
  // =========================================================
  async getOrdersByUser(usuarioId) {

    const user =
      await this.userRepository.findById(usuarioId);

    if (!user) {
      throw new Error(
        "Usuario no encontrado"
      );
    }

    return await this.orderRepository.findByUserId(
      usuarioId
    );
  }

  // =========================================================
  // ACTUALIZAR PEDIDO
  //
  // Solo se permite modificar un pedido PENDIENTE.
  // =========================================================
  async updateOrder(
    id,
    { usuarioId, detalles }
  ) {

    const existingOrder =
      await this.orderRepository.findById(id);

    if (!existingOrder) {
      throw new Error(
        "Pedido no encontrado"
      );
    }

    if (existingOrder.estado !== "PENDIENTE") {
      throw new Error(
        "Solo se pueden modificar pedidos pendientes"
      );
    }

    const user =
      await this.userRepository.findById(
        usuarioId
      );

    if (!user) {
      throw new Error(
        "Usuario no encontrado"
      );
    }

    if (
      !Array.isArray(detalles) ||
      detalles.length === 0
    ) {
      throw new Error(
        "El pedido debe tener al menos un producto"
      );
    }

    const detallesProcesados = [];

    for (const detalle of detalles) {

      if (
        !detalle.productoId ||
        !detalle.cantidad
      ) {
        throw new Error(
          "Los datos del detalle son obligatorios"
        );
      }

      if (
        !Number.isInteger(
          Number(detalle.cantidad)
        ) ||
        Number(detalle.cantidad) <= 0
      ) {
        throw new Error(
          "La cantidad debe ser un entero mayor que 0"
        );
      }

      const product =
        await this.productRepository.findById(
          detalle.productoId
        );

      if (!product) {
        throw new Error(
          "Producto no encontrado"
        );
      }

      if (
        Number(product.stock) <
        Number(detalle.cantidad)
      ) {
        throw new Error(
          `Stock insuficiente para el producto: ${product.nombre}`
        );
      }

      detallesProcesados.push({
        productoId: product.id,
        cantidad: Number(detalle.cantidad),
        precioUnitario: Number(product.precio)
      });
    }

    const order = new Order({
      id,
      usuarioId,
      detalles: detallesProcesados
    });

    order.calcularTotal();

    return await this.orderRepository.update(
      id,
      order
    );
  }

  // =========================================================
  // ACEPTAR PEDIDO
  // =========================================================
  async acceptOrder(id) {

    const existingOrder =
      await this.orderRepository.findById(id);

    if (!existingOrder) {
      throw new Error(
        "Pedido no encontrado"
      );
    }

    if (existingOrder.estado !== "PENDIENTE") {
      throw new Error(
        "El pedido ya fue procesado"
      );
    }

    return await this.orderRepository.changeStatus(
      id,
      "ACEPTADO"
    );
  }

  // =========================================================
  // RECHAZAR PEDIDO
  // =========================================================
  async rejectOrder(id) {

    const existingOrder =
      await this.orderRepository.findById(id);

    if (!existingOrder) {
      throw new Error(
        "Pedido no encontrado"
      );
    }

    if (existingOrder.estado !== "PENDIENTE") {
      throw new Error(
        "El pedido ya fue procesado"
      );
    }

    return await this.orderRepository.changeStatus(
      id,
      "RECHAZADO"
    );
  }

  // =========================================================
  // ELIMINAR PEDIDO
  // =========================================================
  async deleteOrder(id) {

    const existingOrder =
      await this.orderRepository.findById(id);

    if (!existingOrder) {
      throw new Error(
        "Pedido no encontrado"
      );
    }

    await this.orderRepository.delete(id);

    return {
      mensaje: "Pedido eliminado correctamente"
    };
  }
}

module.exports = OrderService;
