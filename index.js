require("dotenv").config();
require("./database/mongoose");

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  AuditLogEvent,
  EmbedBuilder,
} = require("discord.js");
const { Guilds, GuildMembers, GuildMessages } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;
const GuildConfig = require("./Models/GuildConfig"); // Importar el modelo de configuración
const TwitchService = require("./Services/TwitchService");

const client = new Client({
  //intents: [Guilds, GuildMembers, GuildMessages],
  intents: 3276799,
  partials: [User, Message, GuildMember, ThreadMember],
});

const { loadEvents } = require("./Handlers/eventHandler");
const RssService = require("./Services/RssService");

client.config = require("./config.json");
client.events = new Collection();
client.commands = new Collection();

loadEvents(client);

// After client is ready
client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  const rssService = new RssService(client);
  rssService.start();
  console.log("RSS Service started");

  // Inicializar TwitchService y adjuntarlo al cliente
  client.twitchService = new TwitchService(client);
  client.twitchService.start();
  console.log("TwitchService initialized and attached to client");
});

// Autentica el bot con el token de tu aplicación de Discord
client.login(process.env.DISCORD_TOKEN);

const prefix = client.config.prefix || "-"; // Cambia el prefijo según tu configuración

client.on(`messageCreate`, (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();
  const messageArray = message.content.split(" ");
  const argument = messageArray.slice(1);
  const cmd = messageArray[0];

  if (command === `testing`) {
    message.channel.send(`Hola Mundo`);
  }
});

// Helper function to get log channel ID from DB
async function getLogChannelId(guildId) {
  try {
    const config = await GuildConfig.findOne({ guildId });
    return config ? config.logChannelId : null;
  } catch (error) {
    console.error(`Error fetching log channel ID for guild ${guildId}:`, error);
    return null;
  }
}

client.on(Events.ChannelCreate, async (channel) => {
  // Fetch log channel ID from DB
  const logChannelId = await getLogChannelId(channel.guild.id);
  if (!logChannelId) {
    console.log(`Log channel not configured for guild ${channel.guild.id}`);
    return; // No log channel configured
  }

  channel.guild
    .fetchAuditLogs({
      type: AuditLogEvent.ChannelCreate,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = channel.name;
      const id = channel.id;
      let type = channel.type;

      if (type == 0) type = `Texto`;
      if (type == 2) type = `Voz`;
      if (type == 13) type = `Stage`;
      if (type == 15) type = `Foro`;
      if (type == 5) type = `Announcememnt`;
      if (type == 4) type = `Categoria`;

      // Use the fetched log channel ID
      const LogChannel = await channel.guild.channels.cache.get(logChannelId);
      if (!LogChannel) {
        console.error(
          `Log channel ${logChannelId} not found in guild ${channel.guild.id}`
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Canal Creado`)
        .addFields({ name: `Nombre del canal`, value: `${name} (<#${id}>)` })
        .addFields({ name: `Tipo de canal`, value: `${type}` })
        .addFields({ name: `ID del canal`, value: `${id}` })
        .addFields({ name: `Creado por`, value: `${executor.tag}` })
        .setTimestamp();

      LogChannel.send({ embeds: [embed] });
    })
    .catch((err) =>
      console.error("Error fetching audit logs for ChannelCreate:", err)
    );
});

client.on(Events.ChannelDelete, async (channel) => {
  // Fetch log channel ID from DB
  const logChannelId = await getLogChannelId(channel.guild.id);
  if (!logChannelId) {
    console.log(`Log channel not configured for guild ${channel.guild.id}`);
    return; // No log channel configured
  }

  channel.guild
    .fetchAuditLogs({
      type: AuditLogEvent.ChannelDelete,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = channel.name;
      const id = channel.id;
      let type = channel.type;

      if (type == 0) type = `Texto`;
      if (type == 2) type = `Voz`;
      if (type == 13) type = `Stage`;
      if (type == 15) type = `Foro`;
      if (type == 5) type = `Announcememnt`;
      if (type == 4) type = `Categoria`;

      // Use the fetched log channel ID
      const LogChannel = await channel.guild.channels.cache.get(logChannelId);
      if (!LogChannel) {
        console.error(
          `Log channel ${logChannelId} not found in guild ${channel.guild.id}`
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Canal Eliminado`)
        .addFields({ name: `Nombre del canal`, value: `${name}` })
        .addFields({ name: `Tipo de canal`, value: `${type}` })
        .addFields({ name: `ID del canal`, value: `${id}` })
        .addFields({ name: `Eliminado por`, value: `${executor.tag}` })
        .setTimestamp();

      LogChannel.send({ embeds: [embed] });
    })
    .catch((err) =>
      console.error("Error fetching audit logs for ChannelDelete:", err)
    );
});

client.on(Events.GuildBanAdd, async (ban) => {
  // Changed parameter name from member to ban for clarity
  // Fetch log channel ID from DB
  const logChannelId = await getLogChannelId(ban.guild.id);
  if (!logChannelId) {
    console.log(`Log channel not configured for guild ${ban.guild.id}`);
    return; // No log channel configured
  }

  ban.guild
    .fetchAuditLogs({
      type: AuditLogEvent.GuildBanAdd,
    })
    .then(async (audit) => {
      const { executor, reason } = audit.entries.first();

      const name = ban.user.username;
      const id = ban.user.id;

      // Use the fetched log channel ID
      const LogChannel = await ban.guild.channels.cache.get(logChannelId);
      if (!LogChannel) {
        console.error(
          `Log channel ${logChannelId} not found in guild ${ban.guild.id}`
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Usuario baneado`)
        .addFields({ name: `Nombre del usuario`, value: `${name}` })
        .addFields({ name: `ID del usuario`, value: `${id}` })
        .addFields({ name: `Baneado por`, value: `${executor.tag}` })
        .addFields({ name: `Razón`, value: reason || "No especificada" })
        .setTimestamp();

      LogChannel.send({ embeds: [embed] });
    })
    .catch((err) =>
      console.error("Error fetching audit logs for GuildBanAdd:", err)
    );
});

client.on(Events.GuildBanRemove, async (ban) => {
  // Changed parameter name from member to ban for clarity
  // Fetch log channel ID from DB
  const logChannelId = await getLogChannelId(ban.guild.id);
  if (!logChannelId) {
    console.log(`Log channel not configured for guild ${ban.guild.id}`);
    return; // No log channel configured
  }

  ban.guild
    .fetchAuditLogs({
      type: AuditLogEvent.GuildBanRemove,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = ban.user.username;
      const id = ban.user.id;

      // Use the fetched log channel ID
      const LogChannel = await ban.guild.channels.cache.get(logChannelId);
      if (!LogChannel) {
        console.error(
          `Log channel ${logChannelId} not found in guild ${ban.guild.id}`
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Usuario Desbaneado`)
        .addFields({ name: `Nombre del usuario`, value: `${name}` })
        .addFields({ name: `ID del usuario`, value: `${id}` })
        .addFields({ name: `Desbaneado por`, value: `${executor.tag}` })
        .setTimestamp();

      LogChannel.send({ embeds: [embed] });
    })
    .catch((err) =>
      console.error("Error fetching audit logs for GuildBanRemove:", err)
    );
});

client.on(Events.MessageDelete, async (message) => {
  // Ignore partial messages or messages without guild
  if (message.partial || !message.guild) return;

  // Fetch log channel ID from DB
  const logChannelId = await getLogChannelId(message.guild.id);
  if (!logChannelId) {
    // No console log here to avoid spam for servers without log channel
    return; // No log channel configured
  }

  // Try to fetch audit log entry, might not exist if deleted by user themselves or bot
  let executor = message.author; // Assume self-deletion initially
  try {
    const fetchedLogs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageDelete,
    });
    const deletionLog = fetchedLogs.entries.first();

    if (deletionLog) {
      const { executor: logExecutor, target } = deletionLog;
      // Check if the log entry corresponds to the deleted message
      // Check target ID and if the log entry is recent enough (within 5 seconds)
      if (
        target.id === message.author.id &&
        Date.now() - deletionLog.createdTimestamp < 5000
      ) {
        executor = logExecutor;
      }
    }
  } catch (err) {
    console.error("Error fetching audit logs for MessageDelete:", err);
    // Proceed without executor info if audit log fetch fails
  }

  const autor = message.author;
  const msg = message.content;

  if (!msg && message.embeds.length === 0 && message.attachments.size === 0)
    return; // Ignore empty messages

  // Use the fetched log channel ID
  const LogChannel = await message.guild.channels.cache.get(logChannelId);
  if (!LogChannel) {
    console.error(
      `Log channel ${logChannelId} not found in guild ${message.guild.id}`
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Mensaje eliminado`)
    .addFields({
      name: `Contenido del mensaje`,
      value: msg || "*Mensaje vacío o solo contenía embeds/adjuntos*",
    })
    .addFields({ name: `Canal del mensaje`, value: `${message.channel}` })
    .addFields({
      name: `Autor del mensaje`,
      value: `${autor.tag} (${autor.id})`,
    })
    .addFields({
      name: `Eliminado por`,
      value: `${executor.tag} (${executor.id})`,
    })
    .setTimestamp();

  // Add attachments if any
  if (message.attachments.size > 0) {
    embed.addFields({
      name: "Adjuntos",
      value: message.attachments.map((a) => `[${a.name}](${a.url})`).join("\n"),
    });
  }

  LogChannel.send({ embeds: [embed] });
});

client.on(Events.MessageUpdate, async (message, newMessage) => {
  // Ignore partial messages or messages without guild/author
  if (message.partial || !message.guild || !message.author) return;
  // Ignore bot messages
  if (message.author.bot) return;
  // Ignore if content hasn't changed
  if (message.content === newMessage.content) return;

  // Fetch log channel ID from DB
  const logChannelId = await getLogChannelId(message.guild.id);
  if (!logChannelId) {
    // No console log here to avoid spam for servers without log channel
    return; // No log channel configured
  }

  // No need to fetch audit logs for message edits, the author is known
  const autor = message.author;
  const oldMsg = message.content;
  const newMsg = newMessage.content;

  if (!oldMsg && !newMsg) return; // Ignore if both are empty (e.g., embed update only)

  // Use the fetched log channel ID
  const LogChannel = await message.guild.channels.cache.get(logChannelId);
  if (!LogChannel) {
    console.error(
      `Log channel ${logChannelId} not found in guild ${message.guild.id}`
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Mensaje editado`)
    .setURL(newMessage.url) // Add link to the message
    .addFields({ name: `Mensaje inicial`, value: oldMsg || "*Mensaje vacío*" })
    .addFields({ name: `Mensaje editado`, value: newMsg || "*Mensaje vacío*" })
    .addFields({
      name: `Autor del mensaje`,
      value: `${autor.tag} (${autor.id})`,
    })
    .addFields({ name: `Canal`, value: `${message.channel}` })
    .setTimestamp();

  LogChannel.send({ embeds: [embed] });
});
