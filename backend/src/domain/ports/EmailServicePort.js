// =========================================================
// PUERTO DE SALIDA: EmailServicePort
//
// Define el contrato que el núcleo (dominio + aplicación)
// necesita para notificar por correo electrónico.
//
// El núcleo SOLO conoce este contrato. No sabe si el correo
// se envía con Nodemailer, SendGrid, Amazon SES, etc.
// Cualquier adaptador de infraestructura que extienda esta
// clase e implemente sus métodos puede conectarse al sistema
// sin modificar una sola línea de OrderService.
// =========================================================
class EmailServicePort {

  /**
   * Envía al cliente el comprobante de su pedido junto con
   * las instrucciones para realizar el pago.
   *
   * @param {Object} params
   * @param {Object} params.pedido   Pedido creado (id, fecha, total, estado, detalles[])
   * @param {Object} params.cliente  Datos del cliente (id, nombre, email)
   * @returns {Promise<{ enviado: boolean, messageId?: string, previewUrl?: string }>}
   */
  async enviarComprobantePedido({ pedido, cliente }) {
    throw new Error(
      "Método enviarComprobantePedido no implementado"
    );
  }

  /**
   * Notifica al administrador que llegó un nuevo pedido.
   *
   * @param {Object} params
   * @param {Object} params.pedido
   * @param {Object} params.cliente
   * @returns {Promise<{ enviado: boolean, messageId?: string, previewUrl?: string }>}
   */
  async notificarNuevoPedidoAdmin({ pedido, cliente }) {
    throw new Error(
      "Método notificarNuevoPedidoAdmin no implementado"
    );
  }
}

module.exports = EmailServicePort;
