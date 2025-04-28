const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkstreamer')
        .setDescription('Verifica el estado de un streamer')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Nombre de usuario de Twitch')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        
        const username = interaction.options.getString('username');
        
        // Verificar si el servicio existe
        if (!interaction.client.twitchService) {
            await interaction.editReply('❌ Error: TwitchService no está inicializado');
            console.error('TwitchService no encontrado en el cliente');
            return;
        }

        try {
            const result = await interaction.client.twitchService.testStreamer(username);
            await interaction.editReply(`Debug info para ${username}:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\`\`\``);
        } catch (error) {
            await interaction.editReply(`❌ Error: ${error.message}`);
            console.error(`Error en checkstreamer: ${error}`);
        }
    }
};