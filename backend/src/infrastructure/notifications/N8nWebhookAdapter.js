// =========================================================
// ADAPTADOR DE SALIDA: N8nWebhookAdapter
//
// Otra implementación del puerto EmailServicePort. En lugar
// de enviar el correo directamente, publica el evento
// "pedido.creado" en un webhook de n8n; el flujo de n8n decide
// cómo notificar (correo, Telegram, Google Sheets, etc.).
//
// El núcleo (OrderService) no cambia: sigue llamando a
// enviarComprobantePedido() y notificarNuevoPedidoAdmin().
// Cambiar de Nodemailer a n8n es solo cambiar el adaptador
// que se inyecta en server.js.
// =========================================================
const EmailServicePort = require("../../domain/ports/EmailServicePort");
const comprobanteClienteTemplate = require("../email/templates/comprobanteClienteTemplate");
const nuevoPedidoAdminTemplate = require("../email/templates/nuevoPedidoAdminTemplate");
const { folioPedido, normalizarDetalles } = require("../email/templates/helpers");

class N8nWebhookAdapter extends EmailServicePort {

  /**
   * @param {Object} config
   * @param {string} config.webhookUrl   URL del nodo Webhook de n8n
   * @param {string} [config.secreto]    Se envía en el header X-Webhook-Secret
   * @param {number} [config.timeoutMs]  Tiempo máximo de espera (por defecto 5000)
   * @param {string} config.tienda
   * @param {string} config.adminEmail
   * @param {string} config.urlPanel
   * @param {Object} config.pago         Datos bancarios
   * @param {Function} [fetchFn]         Inyectable para pruebas (por defecto fetch global)
   */
  constructor(config, fetchFn = globalThis.fetch) {
    super();

    if (!config || !config.webhookUrl) {
      throw new Error("N8N_WEBHOOK_URL es obligatorio para usar el adaptador de n8n");
    }

    this.config = config;
    this.fetch = fetchFn;
  }

  // ---------------------------------------------------------
  // Datos del pedido en un formato estable para n8n
  // (independiente de los nombres de columnas de PostgreSQL)
  // ---------------------------------------------------------
  serializarPedido(pedido) {
    return {
      id: Number(pedido.id),
      folio: folioPedido(pedido.id),
      fecha: pedido.fecha ? new Date(pedido.fecha).toISOString() : new Date().toISOString(),
      estado: pedido.estado || "PENDIENTE",
      estadoEtiqueta: "Pendiente de pago",
      total: Number(pedido.total),
      detalles: normalizarDetalles(pedido.detalles).map(d => ({
        producto: d.nombre,
        cantidad: d.cantidad,
        precioUnitario: d.precio,
        subtotal: d.subtotal
      }))
    };
  }

  async publicar(cuerpo) {
    const controlador = new AbortController();
    const temporizador = setTimeout(
      () => controlador.abort(),
      Number(this.config.timeoutMs || 5000)
    );

    try {
      const respuesta = await this.fetch(this.config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.secreto ? { "X-Webhook-Secret": this.config.secreto } : {})
        },
        body: JSON.stringify(cuerpo),
        signal: controlador.signal
      });

      if (!respuesta.ok) {
        throw new Error(`n8n respondió ${respuesta.status} ${respuesta.statusText || ""}`.trim());
      }

      console.log(`[n8n] Evento ${cuerpo.evento} (${cuerpo.destinatario}) entregado a n8n`);

      return {
        enviado: true,
        via: "n8n",
        estadoHttp: respuesta.status
      };

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`n8n no respondió en ${this.config.timeoutMs || 5000} ms`);
      }
      if (error.cause?.code) {
        throw new Error(`No se pudo conectar con n8n (${error.cause.code}). ¿Está corriendo en ${this.config.webhookUrl}?`);
      }
      throw error;

    } finally {
      clearTimeout(temporizador);
    }
  }

  // ---------------------------------------------------------
  // Implementación del puerto
  // ---------------------------------------------------------
  async enviarComprobantePedido({ pedido, cliente }) {
    const correo = comprobanteClienteTemplate({
      pedido,
      cliente,
      pago: this.config.pago,
      tienda: this.config.tienda
    });

    return this.publicar({
      evento: "pedido.creado",
      destinatario: "cliente",
      para: cliente.email,
      tienda: this.config.tienda,
      pedido: this.serializarPedido(pedido),
      cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email },
      pago: { ...this.config.pago, referencia: folioPedido(pedido.id) },
      correo,
      enviadoEn: new Date().toISOString()
    });
  }

  async notificarNuevoPedidoAdmin({ pedido, cliente }) {
    const correo = nuevoPedidoAdminTemplate({
      pedido,
      cliente,
      tienda: this.config.tienda,
      urlPanel: this.config.urlPanel
    });

    return this.publicar({
      evento: "pedido.creado",
      destinatario: "admin",
      para: this.config.adminEmail,
      tienda: this.config.tienda,
      pedido: this.serializarPedido(pedido),
      cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email },
      urlPanel: this.config.urlPanel,
      correo,
      enviadoEn: new Date().toISOString()
    });
  }
}

module.exports = N8nWebhookAdapter;
