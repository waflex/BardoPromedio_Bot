const { model, Schema } = require('mongoose');

const ticketSchema = new Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    reason: { type: String, default: null },
    status: { type: String, default: 'Abierto' },
    channelId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    closed: { type: Boolean, default: false }
});

module.exports = model('Ticket', ticketSchema);