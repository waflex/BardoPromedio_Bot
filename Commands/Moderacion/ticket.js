const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Necesitas ayuda?")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`Tickets`)
        .setLabel(`Nuevo Ticket`)
        .setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder().setTitle(
      `Si necesitas ayuda genera un ticket con el boton que esta abajo`
    );

    const embed2 = new EmbedBuilder().setTitle(`Este es tu ticket`);

    await interaction.channel.send({ embeds: [embed], components: [button] });
    await interaction.reply({
      content: `El mensaje ha sido enviado correctamente`,
      ephemeral: true,
    });

    const collector = interaction.channel.createMessageComponentCollector();

    collector.on(`collect`, async (i) => {
      const channel = await interaction.guild.channels.create({
        name: `Ticket ${i.user.tag}`,
        type: ChannelType.GuildText,
        parent: `1134953551081259118`,
      });
      channel.permissionOverwrites.create(i.user.id, {
        ViewChannel: true,
        SendMessages: true,
      });
      channel.permissionOverwrites.create(channel.guild.roles.everyone, {
        ViewChannel: false,
        SendMessages: false,
      });

      channel.send({ embeds: [embed2] });
    });
  },
};
