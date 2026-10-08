// =========================================================
// FÁBRICA: elige qué adaptador del puerto EmailServicePort
// se conecta al núcleo, según EMAIL_PROVIDER.
//
//   none                     -> sin notificaciones
//   ethereal | mailtrap | smtp -> NodemailerAdapter (envío directo)
//   n8n                      -> N8nWebhookAdapter
//                               (+ respaldo Nodemailer, salvo N8N_RESPALDO=none)
// =========================================================
const NodemailerAdapter = require("../email/NodemailerAdapter");
const N8nWebhookAdapter = require("./N8nWebhookAdapter");
const EmailServiceConRespaldo = require("./EmailServiceConRespaldo");

function crearServicioNotificaciones(env = process.env) {

  const proveedor = (env.EMAIL_PROVIDER || "ethereal").toLowerCase();

  if (proveedor === "none") {
    return null;
  }

  const base = NodemailerAdapter.configDesdeEntorno(env);

  if (proveedor !== "n8n") {
    return new NodemailerAdapter(base);
  }

  const n8n = new N8nWebhookAdapter({
    ...base,
    webhookUrl: env.N8N_WEBHOOK_URL,
    secreto: env.N8N_WEBHOOK_SECRET,
    timeoutMs: Number(env.N8N_TIMEOUT_MS || 5000)
  });

  const respaldo = (env.N8N_RESPALDO || "ethereal").toLowerCase();

  if (respaldo === "none") {
    return n8n;
  }

  return new EmailServiceConRespaldo(
    n8n,
    new NodemailerAdapter({ ...base, proveedor: respaldo })
  );
}

module.exports = crearServicioNotificaciones;
