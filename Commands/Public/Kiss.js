const anime = require("anime-actions");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const KissCounter = require('../../Models/KissCounter'); // Importar el modelo

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kiss")
    .setDescription("Besa a un usuario.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Menciona a un Usuario.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.options.getUser("usuario") || interaction.user;

    const url = await anime.kiss();

    const embed = new EmbedBuilder()
      .setDescription(
        `¡**${interaction.user.username}** besó a **${member.username}**!`
      )
      .setColor("DarkButNotBlack")
      .setImage(url);

    try {
      // Buscar o crear el contador para esta pareja en este servidor
      const kissRecord = await KissCounter.findOneAndUpdate(
        {
          guildId: interaction.guildId,
          kisserId: interaction.user.id,
          kissedId: member.id,
        },
        {
          $inc: { count: 1 } // Incrementar el contador
        },
        {
          new: true, // Devolver el documento actualizado
          upsert: true // Crear si no existe
        }
      );

      // Actualizar la descripción del embed con el contador
      embed.setDescription(
        `¡**${interaction.user.username}** besó a **${member.username}**!\n*Se han besado ${kissRecord.count} veces.*`
      );

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error al actualizar el contador de besos:', error);
      // Enviar respuesta sin el contador si hay error en la BD
      await interaction.reply({ embeds: [embed], content: 'Hubo un error al contar los besos, ¡pero el beso se dio!', flags: [MessageFlags.Ephemeral] });
    }
  },
};
