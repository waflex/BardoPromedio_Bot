const mongoose = require('mongoose');

const rssFeedSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    feedUrl: { type: String, required: true },
    lastChecked: { type: Date, default: Date.now },
    lastItemGuid: { type: String, default: null }
});

module.exports = mongoose.model('RssFeed', rssFeedSchema);