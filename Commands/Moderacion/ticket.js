const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const Ticket = require("../../Models/Ticket");
const TicketConfig = require("../../Models/TicketConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription(
      "Genera un ticket para comunicarse con el staff en caso de problemas."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option
        .setName("razon")
        .setDescription("Explica brevemente la razón del ticket.")
        .setRequired(true)
    ),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const razon = interaction.options.getString("razon");

    // Verifica si el usuario ya tiene un ticket abierto en este servidor
    const existingTicket = await Ticket.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      closed: false,
    });

    if (existingTicket) {
      return interaction.reply({
        content: `Ya tienes un ticket abierto: <#${existingTicket.channelId}>`,
        flags: 64,
      });
    }

    // Busca la categoría configurada
    const config = await TicketConfig.findOne({ guildId: interaction.guildId });
    const parentCategoryId = config?.categoryId;
    if (!parentCategoryId) {
      return interaction.reply({
        content: "No se ha configurado la categoría de tickets. Usa /ticket-configurar.",
        flags: 64,
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `Ticket ${interaction.user.tag}`,
      type: ChannelType.GuildText,
      parent: parentCategoryId,
    });
    channel.permissionOverwrites.create(interaction.user.id, {
      ViewChannel: true,
      SendMessages: true,
    });
    channel.permissionOverwrites.create(channel.guild.roles.everyone, {
      ViewChannel: false,
      SendMessages: false,
    });

    // Embed con la razón y estado
    const embed2 = new EmbedBuilder()
      .setTitle(`Ticket de ${interaction.user.tag}`)
      .addFields(
        { name: "Usuario", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Razón", value: razon || "No especificada", inline: false },
        { name: "Estado", value: "Abierto", inline: false },
        { name: "id", value: `${channel.id}`, inline: true }
      )
      .setTimestamp();

    channel.send({ embeds: [embed2] });

    // Guarda el ticket en la base de datos
    await Ticket.create({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      channelId: channel.id,
      razon: razon,
      estado: "Abierto",
    });

    await interaction.reply({
      content: `Tu ticket ha sido creado: <#${channel.id}>`,
      flags: 64,
    });
  },
};
