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
const MusicHistory = require("../Models/MusicHistory");
const MusicSession = require("../Models/MusicSession");

const ffmpegPath = require("ffmpeg-static");
process.env.PATH = path.dirname(process.execPath) + path.delimiter + path.dirname(ffmpegPath) + path.delimiter + process.env.PATH;

const ytDlpPath = (() => {
    const local = path.join(process.cwd(), process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
    try { require("fs").accessSync(local); return local; } catch { return "yt-dlp"; }
})();

console.log("[Music] yt-dlp:", ytDlpPath);
console.log("[Music] ffmpeg:", ffmpegPath);

const activePlayers = new Map();

// Buscar y obtener info (sin downloading)
async function searchAndStream(query) {
    const isUrl = /^https?:\/\//i.test(query);
    const searchQuery = isUrl ? query : `ytsearch1:${query}`;

    return new Promise((resolve, reject) => {
        const ytdlp = spawn(ytDlpPath, [
            "--print", "%(title)s\n%(webpage_url)s\n%(duration_string)s",
            "--no-playlist",
            "--no-warnings",
            searchQuery,
        ], { stdio: ["ignore", "pipe", "pipe"] });

        let output = "";

        ytdlp.stdout.on("data", (d) => output += d.toString());
        ytdlp.on("error", reject);

        ytdlp.on("close", (code) => {
            if (code !== 0 || !output.trim()) {
                return reject(new Error(`yt-dlp falló (code ${code})`));
            }
            const lines = output.trim().split("\n");
            const title = lines[0] || "Sin título";
            const url = lines[1] || query;
            const duration = lines[2] || "??:??";

            console.log(`[searchAndStream] ${title} - ${duration}`);
            resolve({ title, url, duration });
        });
    });
}

// Obtener URL directa para reproducir
async function getDirectUrl(videoUrl) {
    return new Promise((resolve, reject) => {
        const ytdlp = spawn(ytDlpPath, [
            "-x",
            "-f", "bestaudio",
            "-g",
            "--no-playlist",
            videoUrl,
        ], { stdio: ["ignore", "pipe", "pipe"] });

        let output = "";
        ytdlp.stdout.on("data", (d) => output += d.toString());
        ytdlp.on("error", reject);

        ytdlp.on("close", (code) => {
            if (code !== 0 || !output.trim()) {
                return reject(new Error(`getDirectUrl falló (code ${code})`));
            }
            console.log(`[getDirectUrl] URL obtained`);
            resolve(output.trim());
        });
    });
}

// Reproducir siguiente canción
async function playNext(guildId, channel) {
    const session = await MusicSession.getOrCreate(guildId);

    if (session.queue.length === 0) {
        await session.clearQueue();
        const entry = activePlayers.get(guildId);
        if (entry) entry.connection.destroy();
        activePlayers.delete(guildId);
        channel?.send("⏹️ Fin de la cola.");
        return;
    }

    await session.nextSong();
    const song = session.currentSong;

    MusicHistory.record(guildId, song).catch(console.error);

    try {
        const url = await getDirectUrl(song.url);
        const entry = activePlayers.get(guildId);
        if (!entry) return;

        // Download to temp file
        const tempFile = path.join(os.tmpdir(), `music_${Date.now()}.mp3`);
        
        await new Promise((resolve, reject) => {
            const ytdlp = spawn(ytDlpPath, [
                "-x", "-f", "bestaudio", "--audio-format", "mp3", "-o", tempFile, url
            ], { stdio: "ignore" });
            ytdlp.on("close", resolve);
            ytdlp.on("error", reject);
        });

        const stream = fs.createReadStream(tempFile);
        const resource = createAudioResource(stream, { 
            inputType: StreamType.Arbitrary,
            inlineVolume: true 
        });

        entry.player.play(resource);

        if (session.config.announce && channel) {
            channel.send(`▶️ **${song.title}** — <@${song.requestedBy}>`);
        }
    } catch (err) {
        console.error(`[Music] Error:`, err.message);
        await playNext(guildId, channel);
    }
}

// Init
function initMusic(client) {
    client.music = { activePlayers, playNext, searchAndStream, getDirectUrl };
    console.log("[Music] Sistema inicializado");
}

module.exports = initMusic;