const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,EmbedBuilder,PermissionFlagsBits
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Expulsas a un usuario"),
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     */
    execute(interaction) {
      interaction.reply({ content: "Pong!!", ephemeral: true });
    },
  };
  
  