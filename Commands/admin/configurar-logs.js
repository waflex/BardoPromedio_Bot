const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const GuildConfig = require('../../Models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-logs')
        .setDescription('Configura el canal para los registros de moderación.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('El canal donde se enviarán los logs.')
                .addChannelTypes(ChannelType.GuildText) // Asegura que solo se puedan seleccionar canales de texto
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: 'Este comando solo puede usarse en un servidor.', ephemeral: true });
        }

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'No tienes permisos para usar este comando.', ephemeral: true });
        }

        const logChannel = interaction.options.getChannel('canal');
        const guildId = interaction.guild.id;

        try {
            // Busca y actualiza, o crea si no existe (upsert: true)
            await GuildConfig.findOneAndUpdate(
                { guildId: guildId },
                { logChannelId: logChannel.id },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            await interaction.reply({ content: `El canal de logs ha sido configurado a ${logChannel}.`, ephemeral: true });
        } catch (error) {
            console.error('Error al configurar el canal de logs:', error);
            await interaction.reply({ content: 'Hubo un error al intentar configurar el canal de logs.', ephemeral: true });
        }
    },
};