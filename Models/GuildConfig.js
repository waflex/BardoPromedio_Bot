const { model, Schema } = require('mongoose');

const guildConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    logChannelId: { type: String, required: true },
});

module.exports = model('GuildConfig', guildConfigSchema);