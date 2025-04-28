const { model, Schema } = require('mongoose');

let streamerSchema = new Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true }, // Canal de Discord para notificaciones
    twitchUserId: { type: String, required: true }, // ID de usuario de Twitch
    twitchUsername: { type: String, required: true }, // Nombre de usuario de Twitch
    isLive: { type: Boolean, default: false }, // Último estado conocido
    lastLiveAt: { type: Date, default: null }, // Hora del último inicio de stream
});

module.exports = model('Streamer', streamerSchema);