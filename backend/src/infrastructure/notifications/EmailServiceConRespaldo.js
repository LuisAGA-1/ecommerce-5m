// =========================================================
// ADAPTADOR COMPUESTO: EmailServiceConRespaldo
//
// También implementa EmailServicePort. Envuelve dos adaptadores:
// intenta con el principal (n8n) y, si falla (n8n apagado,
// timeout, error HTTP), usa el de respaldo (Nodemailer).
// El núcleo no se entera de cuál de los dos se usó.
// =========================================================
const EmailServicePort = require("../../domain/ports/EmailServicePort");

class EmailServiceConRespaldo extends EmailServicePort {

  constructor(principal, respaldo, registrar = console) {
    super();
    this.principal = principal;
    this.respaldo = respaldo;
    this.registrar = registrar;
  }

  async conRespaldo(metodo, datos) {
    try {
      return await this.principal[metodo](datos);
    } catch (error) {
      if (!this.respaldo) throw error;

      this.registrar.warn(
        `[notificaciones] Falló el adaptador principal (${error.message}); usando respaldo.`
      );

      const resultado = await this.respaldo[metodo](datos);

      return {
        ...resultado,
        respaldo: true,
        motivoRespaldo: error.message
      };
    }
  }

  enviarComprobantePedido(datos) {
    return this.conRespaldo("enviarComprobantePedido", datos);
  }

  notificarNuevoPedidoAdmin(datos) {
    return this.conRespaldo("notificarNuevoPedidoAdmin", datos);
  }
}

module.exports = EmailServiceConRespaldo;
