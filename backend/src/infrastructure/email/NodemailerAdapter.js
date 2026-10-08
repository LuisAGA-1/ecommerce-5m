// =========================================================
// ADAPTADOR DE SALIDA: NodemailerAdapter
//
// Implementa EmailServicePort usando la librería Nodemailer.
// Es la ÚNICA pieza del sistema que importa "nodemailer";
// el dominio y los casos de uso no saben que existe.
//
// Proveedores soportados (variable EMAIL_PROVIDER):
//   - ethereal : bandeja de pruebas de Ethereal (por defecto).
//                Si no hay SMTP_USER/SMTP_PASS crea una cuenta
//                de prueba automáticamente.
//   - mailtrap : sandbox de Mailtrap (sandbox.smtp.mailtrap.io).
//   - smtp     : cualquier servidor SMTP real.
// =========================================================
const nodemailer = require("nodemailer");

const EmailServicePort = require("../../domain/ports/EmailServicePort");
const comprobanteClienteTemplate = require("./templates/comprobanteClienteTemplate");
const nuevoPedidoAdminTemplate = require("./templates/nuevoPedidoAdminTemplate");

const HOSTS_POR_PROVEEDOR = {
  ethereal: { host: "smtp.ethereal.email", port: 587 },
  mailtrap: { host: "sandbox.smtp.mailtrap.io", port: 2525 }
};

class NodemailerAdapter extends EmailServicePort {

  /**
   * @param {Object} config
   * @param {string} config.proveedor       ethereal | mailtrap | smtp
   * @param {Object} config.smtp            { host, port, secure, user, pass }
   * @param {string} config.remitente       Ej. '"Tienda 5M" <no-reply@tienda5m.test>'
   * @param {string} config.adminEmail      Correo que recibe avisos de nuevos pedidos
   * @param {string} config.tienda          Nombre comercial
   * @param {string} config.urlPanel        URL del panel de administración
   * @param {Object} config.pago            Datos bancarios para las instrucciones
   * @param {Object} [transporter]          Transporte inyectable (pruebas)
   */
  constructor(config, transporter = null) {
    super();
    this.config = config;
    this.transporter = transporter;
    this.cuentaPrueba = null;
  }

  // ---------------------------------------------------------
  // Crea el transporte SMTP la primera vez que se necesita.
  // ---------------------------------------------------------
  async obtenerTransporte() {

    if (this.transporter) {
      return this.transporter;
    }

    const { proveedor, smtp } = this.config;
    const base = HOSTS_POR_PROVEEDOR[proveedor] || {};

    let user = smtp.user;
    let pass = smtp.pass;

    // Ethereal sin credenciales: se genera una cuenta temporal.
    if (proveedor === "ethereal" && (!user || !pass)) {
      this.cuentaPrueba = await nodemailer.createTestAccount();
      user = this.cuentaPrueba.user;
      pass = this.cuentaPrueba.pass;

      console.log("[email] Cuenta Ethereal generada:");
      console.log(`[email]   usuario:    ${user}`);
      console.log(`[email]   contraseña: ${pass}`);
      console.log("[email]   bandeja:    https://ethereal.email/login");
    }

    this.transporter = nodemailer.createTransport({
      host: smtp.host || base.host,
      port: Number(smtp.port || base.port || 587),
      secure: Boolean(smtp.secure),
      auth: { user, pass }
    });

    return this.transporter;
  }

  // ---------------------------------------------------------
  // Envío genérico. Devuelve un resultado neutral para el núcleo.
  // ---------------------------------------------------------
  async enviar({ para, subject, html, text }) {

    const transporte = await this.obtenerTransporte();

    const info = await transporte.sendMail({
      from: this.config.remitente,
      to: para,
      subject,
      html,
      text
    });

    // Solo Ethereal genera URL de vista previa.
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    if (previewUrl) {
      console.log(`[email] Vista previa (${para}): ${previewUrl}`);
    }

    return {
      enviado: true,
      messageId: info.messageId,
      previewUrl
    };
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

    return this.enviar({ para: cliente.email, ...correo });
  }

  async notificarNuevoPedidoAdmin({ pedido, cliente }) {

    const correo = nuevoPedidoAdminTemplate({
      pedido,
      cliente,
      tienda: this.config.tienda,
      urlPanel: this.config.urlPanel
    });

    return this.enviar({ para: this.config.adminEmail, ...correo });
  }
}

// -----------------------------------------------------------
// Construye la configuración a partir de variables de entorno.
// Se mantiene aquí (infraestructura) para que el núcleo nunca
// lea process.env.
// -----------------------------------------------------------
NodemailerAdapter.configDesdeEntorno = function (env = process.env) {
  return {
    proveedor: (env.EMAIL_PROVIDER || "ethereal").toLowerCase(),
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    remitente: env.EMAIL_FROM || '"Tienda 5M" <no-reply@tienda5m.test>',
    adminEmail: env.ADMIN_EMAIL || "admin@tienda5m.test",
    tienda: env.STORE_NAME || "Tienda 5M",
    urlPanel: env.ADMIN_PANEL_URL || "http://localhost:5173",
    pago: {
      banco: env.PAY_BANK || "BBVA México",
      titular: env.PAY_HOLDER || "Tienda 5M S.A. de C.V.",
      cuenta: env.PAY_ACCOUNT || "0123456789",
      clabe: env.PAY_CLABE || "012100001234567895",
      correoComprobantes: env.PAY_PROOF_EMAIL || "pagos@tienda5m.test",
      plazoHoras: env.PAY_DEADLINE_HOURS || "48"
    }
  };
};

module.exports = NodemailerAdapter;
