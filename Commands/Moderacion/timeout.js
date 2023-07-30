const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Dejas sin opcion a escribir a un usuario")
    .addUserOption((option) =>
      option
        .setName(`target`)
        .setDescription(`Usuario a Mutear`)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName(`tiempo`)
        .setDescription(`tiempo del muteo en minutos`)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName(`razon`).setDescription(`y que te hizo? :C`)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const user = interaction.options.getUser(`target`);
    const tiempo = interaction.options.getInteger(`tiempo`);
    const { guild } = interaction;
    let razon = interaction.options.getString(`razon`);

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(console.error);

    if (!razon) razon = "No hay razon";
    if (user.id === interaction.user.id)
      return interaction.reply({
        content: `No puedes mutearte a ti mismo`,
        ephemeral: true,
      });
    if (user.id === client.user.id)
      return interaction.reply({
        content: `Hey eso es grosero, a mi no eh?!`,
        ephemeral: true,
      });
    if (
      member.roles.highest.position >= interaction.member.roles.highest.position
    )
      return interaction.reply({
        content: `no puedes mutear a alguien con un rol superior o igual al tuyo`,
        ephemeral: true,
      });
    if (!member.kickable)
      return interaction.reply({
        content: `No puedo mutear a alguien con un rol superior al mio`,
        ephemeral: true,
      });
    if (tiempo > 10000)
      return interaction.reply({
        content: `el tiempo no puede supera los 10.000 minutos`,
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
      .setTitle(`${user.tag} Muteado perro`)
      .setColor(`#ff0000`)
      .setTimestamp()
      .setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
      .addFields(
        { name: `Razon`, value: `${razon}`, inline: true },
        { name: `Tiempo`, value: `${tiempo}`, inline: true }
      );

    await member.timeout(tiempo * 60 * 1000, razon).catch(console.error);
    interaction.reply({ embeds: [embed] });
  },
};
