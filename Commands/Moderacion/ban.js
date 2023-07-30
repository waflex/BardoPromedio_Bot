const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("BanHammer")
    .addUserOption((option) =>
      option
        .setName(`target`)
        .setDescription(`Usuario a Kickear`)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName(`razon`).setDescription(`y xq se va?`)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const user = interaction.options.getUser(`target`);
    const { guild } = interaction;
    let razon = interaction.options.getString(`razon`);

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(console.error);

    if (!razon) razon = "No hay razon";
    if (user.id === interaction.user.id)
      return interaction.reply({
        content: `No puedes Banerate a ti mismo`,
        ephemeral: true,
      });
    if (user.id === client.user.id)
      return interaction.reply({
        content: `Siquiera se puede?`,
        ephemeral: true,
      });
    if (
      member.roles.highest.position >= interaction.member.roles.highest.position
    )
      return interaction.reply({
        content: `no puedes Banear a alguien con un rol superior o igual al tuyo`,
        ephemeral: true,
      });
    if (!member.kickable)
      return interaction.reply({
        content: `No puedo Banear a alguien con un rol superior al mio`,
        ephemeral: true,
      });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${guild.name}`,
        iconURL: `${
          guild.iconURL({ dynamic: true }) ||
          "https://cdn.discordapp.com/attachments/1053464482095050803/1053464952607875072/PRywUXcqg0v5DD6s7C3LyQ.png"
        }`,
      })
      .setTitle(`${user.tag} a sido Baneado del servidor`)
      .setColor(`#ff0000`)
      .setTimestamp()
      .setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
      .addFields({ name: `Razon`, value: `${razon}` });

    await member
      .ban({ deleteMessageSeconds: 30, reason: razon })
      .catch(console.error);
    interaction.reply({ embeds: [embed] });
  },
};
