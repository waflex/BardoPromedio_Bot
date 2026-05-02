const { SlashCommandBuilder } = require("discord.js");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    StreamType,
} = require("@discordjs/voice");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");
const MusicSession = require("../../Models/MusicSession");
const MusicHistory = require("../../Models/MusicHistory");
const ffmpegPath = require("ffmpeg-static");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce o encola una canción desde YouTube.")
        .addStringOption((option) =>
            option
                .setName("cancion")
                .setDescription("Nombre o URL de la canción.")
                .setRequired(true)
        ),

    async execute(interaction) {
        console.log("[/play] Inicio - query:", interaction.options.getString("cancion"));

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({
                content: "¡Debes estar en un canal de voz para que pueda unirme!",
                flags: 64,
            });
        }

        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const { activePlayers, playNext, searchAndStream } = interaction.client.music;

        try {
            const query = interaction.options.getString("cancion").trim();
            console.log("[/play] Buscando:", query);

            const session = await MusicSession.getOrCreate(guildId);

            // Buscar info de la canción
            await interaction.editReply({ content: "🔍 Buscando canción..." });
            console.log("[/play] Llamando searchAndStream...");
            const result = await searchAndStream(query);
            console.log("[/play] searchAndStream result:", result);
            const { title, url, duration } = result;

            const song = {
                title,
                url,
                duration,
                requestedBy: interaction.user.id,
                requestedByTag: interaction.user.tag,
            };

            // Si ya hay música activa → encolar
            if (session.isPlaying && activePlayers.has(guildId)) {
                console.log("[/play] Encolando, isPlaying:", session.isPlaying, "activePlayers has guildId:", activePlayers.has(guildId));
                await session.addToQueue(song);
                return await interaction.editReply({
                    content: `🎵 **${title}** agregada a la cola en la posición #${session.queue.length}.`,
                });
            }

            // Estado desincronizado → limpiar
            if (session.isPlaying && !activePlayers.has(guildId)) {
                console.log("[/play] Limpiando cola desincronizada");
                await session.clearQueue();
            }

            // Crear conexión de voz
            console.log("[/play] Creando conexión de voz...");
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: true,
            });

            console.log("[/play] Creando player...");
            const player = createAudioPlayer();

            player.on(AudioPlayerStatus.Idle, () => {
                console.log("[/play] Song ended, playing next...");
                playNext(guildId, interaction.channel)
            });
            
            player.on(AudioPlayerStatus.Playing, () => {
                console.log("[/play] Audio is now playing!");
                interaction.editReply({
                    content: `▶️ Ahora reproduciendo: **${title}** (${duration})`
                }).catch(() => {});
            });
            
            player.on("error", (err) => {
                console.error(`[Music] Player error:`, err.message);
            });

            connection.on("stateChange", (oldState, newState) => {
                console.log("[/play] Voice state:", newState.status);
                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    activePlayers.delete(guildId);
                    MusicSession.getOrCreate(guildId).then(s => s.clearQueue()).catch(() => {});
                }
            });

            activePlayers.set(guildId, { player, connection });

            // Reproducir directamente
            session.currentSong = song;
            session.isPlaying = true;
            await session.save();
            MusicHistory.record(guildId, song).catch(console.error);

            // Obtener URL directa
            console.log("[/play] Obteniendo URL directa...");
            const { getDirectUrl } = interaction.client.music;
            const directUrl = await getDirectUrl(url);
            console.log("[/play] URL obtained, downloading...");
            
            // Download to temp file
            const tempFile = path.join(os.tmpdir(), `music_${Date.now()}.mp3`);
            
            const ytdlp = spawn("./yt-dlp.exe", [
                "-x", 
                "-f", "bestaudio",
                "--audio-format", "mp3",
                "-o", tempFile,
                directUrl
            ], { stdio: "ignore" });
            
            await new Promise((resolve, reject) => {
                ytdlp.on("close", resolve);
                ytdlp.on("error", reject);
            });
            
            console.log("[/play] Downloaded, creating resource...");
            const stream = fs.createReadStream(tempFile);
            const resource = createAudioResource(stream, { 
                inputType: StreamType.Arbitrary,
                inlineVolume: true 
            });

            console.log("[/play] Playing...");
            player.play(resource);
            connection.subscribe(player);

            await interaction.editReply({
                content: `▶️ Ahora reproduciendo: **${title}** (${duration})`,
            });
            console.error("[/play] ERROR:", error.message);
            console.error("[/play] Stack:", error.stack);

            try {
                const s = await MusicSession.getOrCreate(guildId);
                if (!activePlayers.has(guildId)) await s.clearQueue();
            } catch (e) { console.error("[/play] Error limpiando cola:", e.message); }

            await interaction.editReply({
                content: "❌ Hubo un error al intentar reproducir la canción.",
            });
        }catch (error) {
                console.error("[/play] Error:", error.message);
                console.error("[/play] Stack:", error.stack);
                await interaction.editReply({
                    content: "❌ Hubo un error al intentar reproducir la canción.",
                });
            }
    },
};