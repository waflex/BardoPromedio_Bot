const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require("discord.js");
const Streamer = require('../../Models/Streamer');
const { ApiClient } = require('@twurple/api'); // Corrected import
const twurpleAuth = require('@twurple/auth'); // Import the whole module

// Configura la autenticación con Twitch usando variables de entorno
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    console.error("Error: TWITCH_CLIENT_ID o TWITCH_CLIENT_SECRET no están definidos en las variables de entorno.");
    // Podrías querer manejar esto de forma más robusta, quizás deshabilitando el comando.
}

let authProvider;
let apiClient;

// Function to initialize Twitch API client if not already done
function initializeTwitchApi() {
    if (!apiClient) {
        if (!clientId || !clientSecret) {
            console.error("Error: TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET are not defined.");
            // Throw an error or handle appropriately to prevent proceeding without credentials
            throw new Error("Twitch API credentials missing.");
        }
        try {
            authProvider = new twurpleAuth.AppTokenAuthProvider(clientId, clientSecret);
            apiClient = new ApiClient({ authProvider });
            console.log("Twitch API Client Initialized.");
        } catch (error) {
            console.error("Error during Twitch API client initialization:", error);
            // Clear potentially partially initialized state
            authProvider = null;
            apiClient = null;
            // Re-throw the error to be caught by the caller
            throw new Error(`Failed to initialize Twitch API client: ${error.message}`);
        }
    }
}

// Función auxiliar para obtener datos de usuario de Twitch
async function getTwitchUser(username) {
    initializeTwitchApi(); // Ensure API client is initialized
    try {
        const user = await apiClient.users.getUserByName(username);
        return user;
    } catch (error) {
        console.error(`Error fetching Twitch user ${username}:`, error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("streamers")
        .setDescription("Gestiona las notificaciones de streamers de Twitch.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('agregar')
                .setDescription('Añade un streamer para notificar cuando esté en vivo.')
                .addStringOption(option =>
                    option.setName('usuario')
                        .setDescription('El nombre de usuario de Twitch del streamer.')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('El canal donde se enviarán las notificaciones.')
                        .addChannelTypes(ChannelType.GuildText) // Asegura que sea un canal de texto
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('eliminar')
                .setDescription('Elimina un streamer de las notificaciones.')
                .addStringOption(option =>
                    option.setName('usuario')
                        .setDescription('El nombre de usuario de Twitch del streamer a eliminar.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('lista')
                .setDescription('Muestra la lista de streamers configurados en este servidor.')),

    async execute(interaction) {
        // Initialize API client at the start of execution
        try {
            initializeTwitchApi();
        } catch (error) {
            console.error("Failed to initialize Twitch API:", error);
            return interaction.reply({ content: 'Error: Failed to initialize Twitch integration. Please check bot configuration.', ephemeral: true });
        }
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (!clientId || !clientSecret) {
             return interaction.reply({ content: 'Error: La integración con Twitch no está configurada correctamente por el administrador del bot.', ephemeral: true });
        }

        switch (subcommand) {
            case 'agregar':
                const twitchUsernameToAdd = interaction.options.getString('usuario').toLowerCase();
                const channel = interaction.options.getChannel('canal');
                try {
                    // Verificar si el streamer ya está añadido
                    const existingStreamer = await Streamer.findOne({ guildId, twitchUsername: twitchUsernameToAdd });
                    if (existingStreamer) {
                        return interaction.reply({ content: `El streamer '${twitchUsernameToAdd}' ya está siendo seguido en <#${existingStreamer.channelId}>.`, ephemeral: true });
                    }

                    // Obtener datos del usuario de Twitch para validar y obtener ID
                    const twitchUser = await getTwitchUser(twitchUsernameToAdd);
                    if (!twitchUser) {
                        return interaction.reply({ content: `No se pudo encontrar al usuario de Twitch '${twitchUsernameToAdd}'. Verifica el nombre de usuario.`, ephemeral: true });
                    }

                    // Guardar en la base de datos
                    await Streamer.create({
                        guildId: guildId,
                        channelId: channel.id,
                        twitchUserId: twitchUser.id,
                        twitchUsername: twitchUser.name, // Usar el nombre canónico de la API
                    });

                    await interaction.reply({
                        content: `¡Perfecto! Se notificará en ${channel} cuando **${twitchUser.displayName}** (${twitchUser.name}) inicie stream.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error adding streamer:', error);
                    await interaction.reply({
                        content: 'Ocurrió un error al añadir el streamer. Por favor, inténtalo de nuevo.',
                        ephemeral: true
                    });
                }
                break;

            case 'eliminar':
                const twitchUsernameToRemove = interaction.options.getString('usuario').toLowerCase();

                try {
                    const result = await Streamer.findOneAndDelete({
                        guildId: guildId,
                        twitchUsername: twitchUsernameToRemove
                    });

                    if (result) {
                        await interaction.reply({ content: `El streamer '${twitchUsernameToRemove}' ha sido eliminado de las notificaciones.`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: `El streamer '${twitchUsernameToRemove}' no se encontró en la lista.`, ephemeral: true });
                    }
                } catch (error) {
                    console.error('Error removing streamer:', error);
                    await interaction.reply({
                        content: 'Ocurrió un error al eliminar el streamer.',
                        ephemeral: true
                    });
                }
                break;

            case 'lista':
                try {
                    const streamers = await Streamer.find({ guildId: guildId });
                    if (streamers.length === 0) {
                        return interaction.reply({ content: 'No hay streamers configurados para notificaciones en este servidor.', ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Streamers Seguidos en ${interaction.guild.name}`)
                        .setColor('#6441a5') // Color de Twitch
                        .setTimestamp();

                    let description = '';
                    streamers.forEach(s => {
                        description += `🔹 **${s.twitchUsername}** -> <#${s.channelId}>\n`;
                    });
                    embed.setDescription(description || 'Ninguno');


                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } catch (error) {
                    console.error('Error listing streamers:', error);
                    await interaction.reply({
                        content: 'Ocurrió un error al listar los streamers.',
                        ephemeral: true
                    });
                }
                break;
        }
    }
};