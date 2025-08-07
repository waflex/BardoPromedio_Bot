const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Ticket = require("../../Models/Ticket");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-cerrar")
    .setDescription("Cierra un ticket y elimina el canal asignado.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option
        .setName("ticketid")
        .setDescription("ID del canal del ticket")
        .setRequired(true)
    ),
  async execute(interaction) {
    const channelId = interaction.options.getString("ticketid");
    const ticket = await Ticket.findOne({ channelId });

    if (!ticket || ticket.closed) {
      return interaction.reply({
        content: "No se encontró el ticket o ya está cerrado.",
        flags: 64,
      });
    }

    ticket.estado = "Cerrado";
    ticket.closed = true;
    await ticket.save();

    // Responde antes de eliminar el canal/hilo
    await interaction.reply({
      content: "El ticket ha sido cerrado y el canal eliminado.",
      flags: 64,
    });

    // Elimina el canal/hilo
    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (channel) await channel.delete("Ticket cerrado");
  },
};