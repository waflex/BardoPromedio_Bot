const {GatewayIntentBits, Partials, Client, ActivityType} = require("discord.js");
const {Guils, GuildMembers, GuildVoiceStates, ThreadMember} = GatewayIntentBits;
const {User, Message, GuildMember, ThreadMember} = Partials;

const client = new Client({
    intents: [Guils, GuildMembers, GuildVoiceStates],
    partials: [User, Message, GuildMember, ThreadMember],
});

client.login(process.env.BOT_TOKEN).then(() => {
    console.log("Bot conectado exitosamente.");
    client.user.setPresence({name: "la música", type: ActivityType.Listening});
}).catch((error) => {
    console.error("Error al conectar el bot:", error);
});