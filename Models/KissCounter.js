const { model, Schema } = require('mongoose');

const kissCounterSchema = new Schema({
    guildId: { type: String, required: true },
    kisserId: { type: String, required: true },
    kissedId: { type: String, required: true },
    count: { type: Number, default: 0 }
});

// Crear un índice compuesto para búsquedas eficientes
kissCounterSchema.index({ guildId: 1, kisserId: 1, kissedId: 1 }, { unique: true });

module.exports = model('KissCounter', kissCounterSchema);