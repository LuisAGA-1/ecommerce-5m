class OrderController {

  constructor(orderService) {
    this.orderService = orderService;
  }

  // =========================================================
  // CREAR PEDIDO
  // =========================================================
 async create(req, res) {
   try {

     const { detalles } = req.body;

     const order =
       await this.orderService.createOrder({
         usuarioId: req.usuario.id,
         detalles
       });

     res.status(201).json(order);

   } catch (error) {

     console.error(error);

     res.status(400).json({
       mensaje: error.message
     });
   }
 }
  // =========================================================
  // OBTENER TODOS LOS PEDIDOS
  // ADMIN
  // =========================================================
  async getAll(req, res) {

    try {

      const orders =
        await this.orderService.getOrders();

      res.json(orders);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        mensaje: "Error al obtener los pedidos"
      });
    }
  }

  // =========================================================
  // OBTENER PEDIDO POR ID
  // =========================================================
  async getById(req, res) {

    try {

      const { id } = req.params;

      const order =
        await this.orderService.getOrderById(id);

      res.json(order);

    } catch (error) {

      console.error(error);

      if (
        error.message ===
        "Pedido no encontrado"
      ) {
        return res.status(404).json({
          mensaje: error.message
        });
      }

      res.status(500).json({
        mensaje: "Error al obtener el pedido"
      });
    }
  }

  // =========================================================
  // OBTENER PEDIDOS DEL CLIENTE AUTENTICADO
  // =========================================================
  async getMyOrders(req, res) {

    try {

      const usuarioId = req.usuario.id;

      const orders =
        await this.orderService.getOrdersByUser(
          usuarioId
        );

      res.json(orders);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        mensaje: "Error al obtener tus pedidos"
      });
    }
  }

  // =========================================================
  // ACTUALIZAR PEDIDO
  // =========================================================
  async update(req, res) {

    try {

      const { id } = req.params;

      const {
        usuarioId,
        detalles
      } = req.body;

      const order =
        await this.orderService.updateOrder(
          id,
          {
            usuarioId,
            detalles
          }
        );

      res.json(order);

    } catch (error) {

      console.error(error);

      res.status(400).json({
        mensaje: error.message
      });
    }
  }

  // =========================================================
  // ACEPTAR PEDIDO
  // ADMIN
  // =========================================================
  async accept(req, res) {

    try {

      const { id } = req.params;

      const order =
        await this.orderService.acceptOrder(id);

      res.json({
        mensaje: "Pedido aceptado correctamente",
        pedido: order
      });

    } catch (error) {

      console.error(error);

      res.status(400).json({
        mensaje: error.message
      });
    }
  }

  // =========================================================
  // RECHAZAR PEDIDO
  // ADMIN
  // =========================================================
  async reject(req, res) {

    try {

      const { id } = req.params;

      const order =
        await this.orderService.rejectOrder(id);

      res.json({
        mensaje: "Pedido rechazado correctamente",
        pedido: order
      });

    } catch (error) {

      console.error(error);

      res.status(400).json({
        mensaje: error.message
      });
    }
  }

  // =========================================================
  // ELIMINAR PEDIDO
  // =========================================================
  async delete(req, res) {

    try {

      const { id } = req.params;

      const resultado =
        await this.orderService.deleteOrder(id);

      res.json(resultado);

    } catch (error) {

      console.error(error);

      res.status(400).json({
        mensaje: error.message
      });
    }
  }
}

module.exports = OrderController;
