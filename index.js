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

const client = new Client({
  //intents: [Guilds, GuildMembers, GuildMessages],
  intents: 3276799,
  partials: [User, Message, GuildMember, ThreadMember],
});

const { loadEvents } = require("./Handlers/eventHandler");

client.config = require("./config.json");
client.events = new Collection();
client.commands = new Collection();

loadEvents(client);

// Autentica el bot con el token de tu aplicación de Discord
client.login(client.config.token);

const prefix = `-`;

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

client.on(Events.ChannelCreate, async (channel) => {
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

      const channelID = `1135277458132828280`;
      const Channel = await channel.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setTitle(`Canal Creado`)
        .addFields({ name: `Nombre del canal`, value: `${name} (<#${id}>)` })
        .addFields({ name: `Tipo de canal`, value: `${type}` })
        .addFields({ name: `ID del canal`, value: `${id}` })
        .addFields({ name: `Creado por`, value: `${executor.tag}` })
        .setTimestamp();

      Channel.send({ embeds: [embed] });
    });
});

client.on(Events.ChannelDelete, async (channel) => {
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

      const channelID = `1135277458132828280`;
      const Channel = await channel.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setTitle(`Canal Eliminado`)
        .addFields({ name: `Nombre del canal`, value: `${name}` })
        .addFields({ name: `Tipo de canal`, value: `${type}` })
        .addFields({ name: `ID del canal`, value: `${id}` })
        .addFields({ name: `Eliminado por`, value: `${executor.tag}` })
        .setTimestamp();

      Channel.send({ embeds: [embed] });
    });
});

client.on(Events.GuildBanAdd, async (member) => {
  member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.GuildBanAdd,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = member.user.username;
      const id = member.user.id;

      const channelID = `1135277458132828280`;
      const Channel = await member.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setTitle(`Usuario baneado`)
        .addFields({ name: `Nombre del usuario`, value: `${name}` })
        .addFields({ name: `ID del usuario`, value: `${id}` })
        .addFields({ name: `Baneado por`, value: `${executor.tag}` })
        .setTimestamp();

      Channel.send({ embeds: [embed] });
    });
});

client.on(Events.GuildBanRemove, async (member) => {
  member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.GuildBanRemove,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = member.user.username;
      const id = member.user.id;

      const channelID = `1135277458132828280`;
      const Channel = await member.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setTitle(`Usuario Desbaneado`)
        .addFields({ name: `Nombre del usuario`, value: `${name}` })
        .addFields({ name: `ID del usuario`, value: `${id}` })
        .addFields({ name: `Desbaneado por`, value: `${executor.tag}` })
        .setTimestamp();

      Channel.send({ embeds: [embed] });
    });
});

client.on(Events.MessageDelete, async (message) => {
  message.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MessageDelete,
    })
    .then(async (audit) => {
      const autor = message.author;

      const msg = message.content;

      if (!msg) return;

      const channelID = `1135277458132828280`;
      const Channel = await message.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setTitle(`Mensaje eliminado`)
        .addFields({ name: `Contenido del mensaje`, value: `${msg}` })
        .addFields({ name: `Canal del mensaje`, value: `${message.channel}` })
        .addFields({ name: `Autor del mensaje`, value: `${autor}` })
        .setTimestamp();

      Channel.send({ embeds: [embed] });
    });
});

client.on(Events.MessageUpdate, async (message, newMessage) => {
  message.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MessageUpdate,
    })
    .then(async (audit) => {
      const autor = message.author;

      const msg = message.content;

      if (!msg) return;

      const channelID = `1135277458132828280`;
      const Channel = await message.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setTitle(`Mensaje editado`)
        .addFields({ name: `Mensaje inicial`, value: `${msg}` })
        .addFields({ name: `Mensaje editado`, value: `${newMessage}` })
        .addFields({ name: `Autor del mensaje`, value: `${autor}` })
        .setTimestamp();

      Channel.send({ embeds: [embed] });
    });
});
