const { Schema, model } = require("mongoose");

const MusicHistorySchema = new Schema(
  {
    guildId:          { type: String, required: true, index: true },
    title:            { type: String, required: true },
    url:              { type: String, required: true },
    duration:         { type: String, default: "??:??" },
    requestedBy:      { type: String, required: true },  // userId
    requestedByTag:   { type: String, default: "?" },
    playedAt:         { type: Date, default: Date.now },
  }
);

// TTL: MongoDB elimina automáticamente entradas con más de 30 días
MusicHistorySchema.index({ playedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// ── Statics ────────────────────────────────────────────────────────────────────

/** Guarda una canción en el historial del servidor */
MusicHistorySchema.statics.record = async function (guildId, song) {
  return this.create({
    guildId,
    title:          song.title,
    url:            song.url,
    duration:       song.duration,
    requestedBy:    song.requestedBy,
    requestedByTag: song.requestedByTag,
  });
};

/** Devuelve las últimas N canciones reproducidas en el servidor */
MusicHistorySchema.statics.getLast = async function (guildId, limit = 10) {
  return this.find({ guildId }).sort({ playedAt: -1 }).limit(limit).lean();
};

module.exports = model("MusicHistory", MusicHistorySchema);