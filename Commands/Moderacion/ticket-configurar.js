const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const TicketConfig = require("../../Models/TicketConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-configurar")
    .setDescription("Configura la categoría donde se crearán los tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName("categoria")
        .setDescription("ID de la categoría para los tickets")
        .setRequired(true)
    ),
  async execute(interaction) {
    const categoriaId = interaction.options.getString("categoria");
    await TicketConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      { categoryId: categoriaId },
      { upsert: true }
    );
    await interaction.reply({
      content: `La categoría de tickets ha sido configurada correctamente.`,
      flags: 64,
    });
  },
};