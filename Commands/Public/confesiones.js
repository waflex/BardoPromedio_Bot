const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("confesiones")
      .setDescription("Haz una confesión anonima")
      .addStringOption((option) =>
        option
          .setName(`contenido`)
          .setDescription(`Escribe aquí lo que quieres que diga en la confesión`)
          .setRequired(true)
      ),
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction){
    const sugerencia = interaction.options.getString(`contenido`);
  
      const { guild } = interaction;
  
      const channel = interaction.guild.channels.cache.find(
        (c) => c.id === `1071061399628939444`
      );
  
      const embed = new EmbedBuilder()
        .setTitle(`Anónimo escribió`)
        .setColor(`Random`)
        .setDescription(`${sugerencia}`)
        .setThumbnail(`https://images-ext-2.discordapp.net/external/trFHgPhsDDKFpCtDddmWu1T-LiUu9wUvkJV4rb-qspc/%3Fs%3D612x612%26w%3D0%26k%3D20%26c%3D6lAruYTTFe7j2VDPglI8raeDxet-CnHZJJBvdVeZRP0%3D/https/media.istockphoto.com/id/1371205496/es/vector/icono-de-anonimato-cifrado-seudonimizaci%25C3%25B3n.jpg?width=663&height=663`)
        .setFooter({
          text: `${guild.name}`,
          iconURL: `${guild.iconURL({ dynamic: true })}`,
        });
  
      const message = await channel.send({
        embeds: [embed],
      });
  
      interaction.reply({
        content: `Publicaste exitosamente tu confesión.`,
        ephemeral: true,
      });
    },
  };