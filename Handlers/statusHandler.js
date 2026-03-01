const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { getAllServiceStatuses } = require("../Services/serverStatus");

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
// Pon el ID del canal donde el bot publicará el estado.
// Puedes definirlo en .env como STATUS_CHANNEL_ID
const STATUS_CHANNEL_ID = process.env.STATUS_CHANNEL_ID || "";

// Intervalo de actualización en milisegundos (por defecto: 60 segundos)
const UPDATE_INTERVAL = parseInt(process.env.STATUS_UPDATE_INTERVAL) || 60_000;

// Guardamos la referencia al mensaje para editarlo en lugar de crear uno nuevo
let statusMessageId = null;

// ─── Construcción del embed ───────────────────────────────────────────────────
async function buildEmbed() {
  const services = await getAllServiceStatuses();
  const allOnline = services.every((s) => s.active);
  const anyProblem = services.some((s) => !s.active);

  // Color general: verde si todo ok, rojo si algo cayó
  const embedColor = allOnline ? 0x43b581 : anyProblem ? 0xf04747 : 0xfaa61a;

  const embed = new EmbedBuilder()
    .setTitle("🖥️  Estado del Servidor")
    .setColor(embedColor)
    .setTimestamp()
    .setFooter({
      text: `Actualización automática cada ${UPDATE_INTERVAL / 1000}s`,
    });

  // Un campo por servicio
  for (const svc of services) {
    let statusText;

    if (svc.active && svc.restarted) {
      statusText = `🔄 **Reiniciado** hace poco\n⏱️ Uptime: \`${svc.uptime}\``;
    } else if (svc.active) {
      statusText = `🟢 **En línea**\n⏱️ Uptime: \`${svc.uptime}\``;
    } else {
      statusText = `🔴 **Caído / Detenido**`;
    }

    embed.addFields({
      name: `${svc.emoji}  ${svc.name}`,
      value: statusText,
      inline: true,
    });
  }

  // Resumen general al pie del embed
  if (allOnline) {
    embed.setDescription("✅  Todos los servicios están operativos.");
  } else {
    const caidos = services.filter((s) => !s.active).map((s) => s.name);
    embed.setDescription(
      `⚠️  Servicios caídos: **${caidos.join(", ")}**`
    );
  }

  return embed;
}

// ─── Limpiar el canal (borrar mensajes que no sean del bot) ───────────────────
async function clearChannel(channel) {
  try {
    // Borra mensajes de otros usuarios para que solo queden los del bot
    const messages = await channel.messages.fetch({ limit: 50 });
    const toDelete = messages.filter(
      (m) => m.author.id !== channel.client.user.id
    );
    for (const [, msg] of toDelete) {
      await msg.delete().catch(() => {});
    }
  } catch (_) {}
}

// ─── Función principal: publicar o editar el mensaje de estado ────────────────
async function postOrUpdateStatus(client) {
  if (!STATUS_CHANNEL_ID) {
    console.warn(
      "[ServerStatus] ID canal no está definido en Sistema... Saltando."
    );
    return;
  }

  const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.error(
      `[ServerStatus] No se encontró el canal con ID: ${STATUS_CHANNEL_ID}`
    );
    return;
  }

  // Verificar que el bot tenga permisos necesarios
  const botMember = channel.guild?.members?.me;
  if (
    botMember &&
    !channel
      .permissionsFor(botMember)
      .has([
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ])
  ) {
    console.error(
      "[ServerStatus] El bot no tiene los permisos necesarios en el canal de estado."
    );
    return;
  }

  await clearChannel(channel);

  const embed = await buildEmbed();

  // Si ya tenemos el ID del mensaje, editarlo; si no, crearlo
  if (statusMessageId) {
    try {
      const existingMsg = await channel.messages
        .fetch(statusMessageId)
        .catch(() => null);
      if (existingMsg) {
        await existingMsg.edit({ embeds: [embed] });
        return;
      }
    } catch (_) {}
  }

  // Crear mensaje nuevo (primera vez o si el anterior fue borrado)
  const newMsg = await channel.send({ embeds: [embed] });
  statusMessageId = newMsg.id;
}

// ─── Iniciar el monitor ───────────────────────────────────────────────────────
function startStatusMonitor(client) {
  // Primera publicación inmediata
  postOrUpdateStatus(client);

  // Luego cada UPDATE_INTERVAL milisegundos
  setInterval(() => postOrUpdateStatus(client), UPDATE_INTERVAL);

  console.log(
    `[ServerStatus] Monitor iniciado. Canal: ${STATUS_CHANNEL_ID} | Intervalo: ${UPDATE_INTERVAL / 1000}s`
  );
}

module.exports = { startStatusMonitor };
