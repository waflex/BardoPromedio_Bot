const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Borra mensajes recientes o antiguos si eres admin')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de mensajes a borrar (1 a 100)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const cantidad = interaction.options.getInteger('cantidad');
    const miembro = interaction.member;
    const canal = interaction.channel;

    if (cantidad < 1 || cantidad > 100) {
      return interaction.reply({ content: 'La cantidad debe estar entre 1 y 100.', ephemeral: true });
    }

    // Verifica que el bot tenga permisos
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: 'No tengo permisos para borrar mensajes.', ephemeral: true });
    }

    const esAdmin = miembro.permissions.has(PermissionsBitField.Flags.Administrator);

    if (esAdmin) {
      // Modo admin: borrar uno por uno (incluso antiguos)
      let borrados = 0;
      let lastMessageId;

      while (borrados < cantidad) {
        const options = { limit: 100 };
        if (lastMessageId) options.before = lastMessageId;

        const messages = await canal.messages.fetch(options);
        if (messages.size === 0) break;

        for (const message of messages.values()) {
          try {
            await message.delete();
            borrados++;
            lastMessageId = message.id;

            if (borrados >= cantidad) break;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay opcional
          } catch (error) {
            console.error(`Error al borrar ${message.id}:`, error);
          }
        }
      }

      return interaction.reply({ content: `🧹 Admin: Se borraron ${borrados} mensajes.`, ephemeral: true });

    } else {
      // Modo normal: solo mensajes recientes (menos de 14 días)
      try {
        await canal.bulkDelete(cantidad, true);
        return interaction.reply({ content: `🧹 Se borraron ${cantidad} mensajes recientes.`, ephemeral: true });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'Ocurrió un error al usar bulkDelete.', ephemeral: true });
      }
    }
  }
};
