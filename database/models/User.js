const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  settings: {
    type: Object,
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);