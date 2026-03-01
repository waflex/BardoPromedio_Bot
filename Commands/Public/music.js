const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const play = require("play-dl");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Reproduce una canción desde YouTube o Spotify.")
    .addStringOption((option) =>
      option
        .setName("cancion")
        .setDescription("El nombre o URL de la canción que quieres reproducir.")
        .setRequired(true)
    ),

  async execute(interaction) {
    // 1. Comprobar si el usuario está en un canal de voz
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "¡Debes estar en un canal de voz para que pueda unirme!",
        flags: 64,
      });
    }

    await interaction.deferReply(); // Defer antes de cualquier await largo

    try {
      // 2. Obtener la canción y buscar la información
      const query = interaction.options.getString("cancion").trim();
      const videoInfo = await play.search(query, { limit: 1 });
      if (videoInfo.length === 0) {
        return await interaction.editReply({
          content: "No se encontró ninguna canción con ese nombre o enlace.",
        });
      }

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      const video = videoInfo[0];
      console.log("video url:", video.url);

      const stream = await play.stream(video.url);

      console.log("el stream es:", stream);

      const player = createAudioPlayer();
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      player.play(resource);
      connection.subscribe(player);

      await interaction.editReply({
        content: `▶️ Ahora reproduciendo: **${video.title}** (${video.durationRaw})`,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "Hubo un error al intentar reproducir la canción.",
      });
    }
  },
};
