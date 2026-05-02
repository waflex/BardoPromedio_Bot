const { Schema, model } = require("mongoose");

const SongSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    duration: { type: String, default: "??:??" },
    requestedBy: { type: String, required: true },   // userId
    requestedByTag: { type: String, default: "?" },  // username legible
  },
  { _id: false }
);

const MusicSessionSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },

    // Estado de reproducción
    queue: { type: [SongSchema], default: [] },
    currentSong: { type: SongSchema, default: null },
    isPlaying: { type: Boolean, default: false },

    // Configuración por servidor
    config: {
      volume: { type: Number, default: 100, min: 0, max: 200 },
      defaultVoiceChannelId: { type: String, default: null },
      djRoleId: { type: String, default: null },
      maxQueueSize: { type: Number, default: 50 },
      announce: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// ── Statics ────────────────────────────────────────────────────────────────────

/** Obtiene la sesión del servidor, o la crea si no existe */
MusicSessionSchema.statics.getOrCreate = async function (guildId) {
  let session = await this.findOne({ guildId });
  if (!session) session = await this.create({ guildId });
  return session;
};

// ── Methods ────────────────────────────────────────────────────────────────────

/** Agrega una canción a la cola respetando maxQueueSize */
MusicSessionSchema.methods.addToQueue = async function (song) {
  if (this.queue.length >= this.config.maxQueueSize) {
    throw new Error(`La cola está llena (máximo ${this.config.maxQueueSize} canciones).`);
  }
  this.queue.push(song);
  return this.save();
};

/** Mueve queue[0] → currentSong y actualiza isPlaying */
MusicSessionSchema.methods.nextSong = async function () {
  this.currentSong = this.queue.shift() ?? null;
  this.isPlaying = !!this.currentSong;
  return this.save();
};

/** Limpia cola y estado de reproducción */
MusicSessionSchema.methods.clearQueue = async function () {
  this.queue = [];
  this.currentSong = null;
  this.isPlaying = false;
  return this.save();
};

module.exports = model("MusicSession", MusicSessionSchema);