const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,EmbedBuilder,PermissionFlagsBits
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Expulsas a un usuario")
      .addUserOption((option) => option.setName(`target`).setDescription(`Usuario a Kickear`).setRequired(true))
      .addStringOption((option)=> option.setName(`razon`).setDescription(`y xq se va?`))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction,client) {
      const user = interaction.options.getUser(`target`);
      const {guild} = interaction;
      let razon = interaction.options.getString(`razon`);

      const member = await interaction.guild.members.fetch(user.id).catch(console.error);

      if(!razon) razon = "No hay razon";
      if(user.id=== interaction.user.id) return interaction.reply({content:`No puedes kickearte a ti mismo`, ephemeral: true});
      if(user.id === client.user.id) return interaction.reply({content:`Hey eso es grosero, a mi no eh?!`, ephemeral: true})
      if(member.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({content:`no puedes kickear a alguien con un rol superior o igual al tuyo`,ephemeral: true});
      if(!member.kickable)return interaction.reply({content:`No puedo kickear a alguien con un rol superior al mio`,ephemeral:true});

      const embed = new EmbedBuilder()
      .setAuthor({name: `${guild.name}`,iconURL:`${guild.iconURL({dynamic:true}) || "https://cdn.discordapp.com/attachments/1053464482095050803/1053464952607875072/PRywUXcqg0v5DD6s7C3LyQ.png"}`})
      .setTitle(`${user.tag} a sido kickeado del servidor`)
      .setColor(`#ff0000`)
      .setTimestamp()
      .addFields({name:`Razon`, value:`${razon}`})
    },
  };
  
  