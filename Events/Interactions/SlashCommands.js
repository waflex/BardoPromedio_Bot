const { ChatInputCommandInteraction } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    //console.log(client.commands.get(interaction.commandName));
    if (!command)
      return interaction.reply({
        content: "This command is outdated.",
        ephermal: true,
      });

    if (command.developer && interaction.user.id !== "276152647575404544")
      return interaction.reply({
        content: "This command is only available to the developer.",
        ephermal: true,
      });

    command.execute(interaction, client);
  },
};
