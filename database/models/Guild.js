const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  config: {
    type: Object,
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model('Guild', guildSchema);