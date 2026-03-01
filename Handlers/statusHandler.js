const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { getAllServiceStatuses } = require("../Services/serverStatus");

const STATUS_CHANNEL_ID = process.env.STATUS_CHANNEL_ID || "";
const UPDATE_INTERVAL = parseInt(process.env.STATUS_UPDATE_INTERVAL) || 60_000;

let statusMessageId = null;

// ─── Formato de jugadores ─────────────────────────────────────────────────────
function formatPlayers(players, maxPlayers) {
  if (!players) return "👥 Jugadores: `—`";
  return `👥 Jugadores: \`${players.current}/${players.max ?? maxPlayers}\``;
}

// ─── Construcción del embed ───────────────────────────────────────────────────
async function buildEmbed() {
  const services = await getAllServiceStatuses();
  const allOnline = services.every((s) => s.active);

  const embed = new EmbedBuilder()
    .setTitle("🖥️  Estado del Servidor")
    .setColor(allOnline ? 0x43b581 : 0xf04747)
    .setTimestamp()
    .setFooter({ text: `Actualización cada ${UPDATE_INTERVAL / 1000}s` });

  if (allOnline) {
    embed.setDescription("✅  Todos los servicios están operativos.");
  } else {
    const caidos = services.filter((s) => !s.active).map((s) => s.name);
    embed.setDescription(`⚠️  Servicios caídos: **${caidos.join(", ")}**`);
  }

  for (const svc of services) {
    let statusLines;

    if (svc.active && svc.restarted) {
      statusLines = [
        `🔄 **Reiniciado recientemente**`,
        `⏱️ Uptime: \`${svc.uptime}\``,
        formatPlayers(svc.players, svc.maxPlayers),
      ];
    } else if (svc.active) {
      statusLines = [
        `🟢 **En línea**`,
        `⏱️ Uptime: \`${svc.uptime}\``,
        formatPlayers(svc.players, svc.maxPlayers),
      ];
    } else {
      statusLines = [`🔴 **Caído / Detenido**`];
    }

    embed.addFields({
      name: `${svc.emoji}  ${svc.name}`,
      value: statusLines.join("\n"),
      inline: true,
    });
  }

  return embed;
}

// ─── Limpiar mensajes ajenos en el canal ─────────────────────────────────────
async function clearChannel(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const toDelete = messages.filter((m) => m.author.id !== channel.client.user.id);
    for (const [, msg] of toDelete) await msg.delete().catch(() => {});
  } catch (_) {}
}

// ─── Publicar o editar el mensaje de estado ───────────────────────────────────
async function postOrUpdateStatus(client) {
  if (!STATUS_CHANNEL_ID) {
    console.warn("[ServerStatus] STATUS_CHANNEL_ID no definido en .env");
    return;
  }

  const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.error(`[ServerStatus] Canal no encontrado: ${STATUS_CHANNEL_ID}`);
    return;
  }

  await clearChannel(channel);
  const embed = await buildEmbed();

  if (statusMessageId) {
    const existing = await channel.messages.fetch(statusMessageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] });
      return;
    }
  }

  const newMsg = await channel.send({ embeds: [embed] });
  statusMessageId = newMsg.id;
}

// ─── Iniciar monitor ──────────────────────────────────────────────────────────
function startStatusMonitor(client) {
  postOrUpdateStatus(client);
  setInterval(() => postOrUpdateStatus(client), UPDATE_INTERVAL);
  console.log(`[ServerStatus] Monitor iniciado. Canal: ${STATUS_CHANNEL_ID} | Intervalo: ${UPDATE_INTERVAL / 1000}s`);
}

module.exports = { startStatusMonitor };