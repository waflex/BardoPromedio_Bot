const { startStatusMonitor } = require("../../Handlers/statusHandler");

module.exports = {
  name: "ready",
  once: true, // Se ejecuta solo una vez cuando el bot está listo
  execute(client) {
    console.log(`[Bot] Conectado como ${client.user.tag}`);

    // Iniciar el monitor de estado del servidor
    startStatusMonitor(client);
  },
};
