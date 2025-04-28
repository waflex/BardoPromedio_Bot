const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("boton")
    .setDescription("Un boton jeje"),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */

  async execute(interaction) {
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`test`)
        .setLabel(`Menu`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`test2`)
        .setLabel(`Pagina 1`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`test3`)
        .setLabel(`Pagina 2`)
        .setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setTitle(`Menu`)
      .setDescription(
        `Pagina 1 Comandos de Utilidad \n Pagina 2 Comandos de Moderacion`
      );

    const embed2 = new EmbedBuilder().setTitle(`Comandos Utilidad`).addFields({
      name: `/user`,
      value: `Te Mostrare informacion sobre un Usuario`,
    });

    const embed3 = new EmbedBuilder()
      .setTitle(`Comandos Moderacion`)
      .setDescription(
        `/ban, Baneare un usuario (siempre y cuando no sea tu mismo nivel o superior)`
      );

    await interaction.reply({ embeds: [embed], components: [button] });

    const collector = interaction.channel.createMessageComponentCollector();

    collector.on(`collect`, async (i) => {
      if (i.customId === `test`) {
        if (i.user.id !== interaction.user.id) {
          return await i.reply({
            content: `Solo la persona ejecutando el comando puede usar este medio`,
            ephemeral: true,
          });
        }
        await i.update({ embeds: [embed], components: [button] });
      }
      if (i.customId === `test2`) {
        if (i.user.id !== interaction.user.id) {
          return await i.reply({
            content: `Solo la persona ejecutando el comando puede usar este medio`,
            ephemeral: true,
          });
        }
        await i.update({ embeds: [embed2], components: [button] });
      }
      if (i.customId === `test3`) {
        if (i.user.id !== interaction.user.id) {
          return await i.reply({
            content: `Solo la persona ejecutando el comando puede usar este medio`,
            ephemeral: true,
          });
        }
        await i.update({ embeds: [embed3], components: [button] });
      }
    });
  },
};
