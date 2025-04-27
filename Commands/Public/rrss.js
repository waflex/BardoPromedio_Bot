const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const RssFeed = require('../../Models/RssFeed');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rrss")
        .setDescription("Manage RSS feeds")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new RSS feed')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('The URL of the RSS feed')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to post updates to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all RSS feeds for this server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove an RSS feed')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('The URL of the RSS feed to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check the latest items from RSS feeds')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add':
                const url = interaction.options.getString('url');
                const channel = interaction.options.getChannel('channel');

                try {
                    // Validate RSS feed
                    const feed = await parser.parseURL(url);
                    
                    // Save to database
                    await RssFeed.create({
                        guildId: interaction.guildId,
                        channelId: channel.id,
                        feedUrl: url,
                    });

                    await interaction.reply({ 
                        content: `Successfully added RSS feed for ${feed.title} to ${channel}`,
                        ephemeral: true 
                    });
                } catch (error) {
                    await interaction.reply({ 
                        content: 'Failed to add RSS feed. Please check the URL.',
                        ephemeral: true 
                    });
                }
                break;

            case 'list':
                const feeds = await RssFeed.find({ guildId: interaction.guildId });
                if (feeds.length === 0) {
                    await interaction.reply({ 
                        content: 'No RSS feeds configured for this server.',
                        ephemeral: true 
                    });
                    return;
                }

                const feedList = feeds.map(feed => 
                    `Channel: <#${feed.channelId}> - URL: ${feed.feedUrl}`
                ).join('\n');

                await interaction.reply({ 
                    content: `Configured RSS feeds:\n${feedList}`,
                    ephemeral: true 
                });
                break;

            case 'remove':
                const removeUrl = interaction.options.getString('url');
                const removed = await RssFeed.findOneAndDelete({ 
                    guildId: interaction.guildId,
                    feedUrl: removeUrl 
                });

                if (removed) {
                    await interaction.reply({ 
                        content: 'RSS feed removed successfully.',
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: 'RSS feed not found.',
                        ephemeral: true 
                    });
                }
                break;

            case 'check':
                try {
                    // Get all feeds for this server
                    const feeds = await RssFeed.find({ guildId: interaction.guildId });

                    if (feeds.length === 0) {
                        await interaction.reply({
                            content: 'No RSS feeds configured for this server.',
                            ephemeral: true
                        });
                        return;
                    }

                    // Defer reply as we might need more time to fetch all feeds
                    await interaction.deferReply({ ephemeral: true });

                    const embeds = [];

                    // Process each feed
                    for (const feedData of feeds) {
                        try {
                            const feed = await parser.parseURL(feedData.feedUrl);
                            const latestItems = feed.items.slice(0, 3); // Get latest 3 items

                            const embed = new EmbedBuilder()
                                .setTitle(`📰 ${feed.title}`)
                                .setDescription(feed.description || 'No description available')
                                .setURL(feed.link || feedData.feedUrl)
                                .setColor('#0099ff')
                                .setFooter({ text: `Channel: #${interaction.guild.channels.cache.get(feedData.channelId)?.name}` })
                                .setTimestamp();

                            latestItems.forEach((item, index) => {
                                embed.addFields({
                                    name: `${index + 1}. ${item.title}`,
                                    value: `[Read More](${item.link})\nPublished: ${new Date(item.pubDate).toLocaleString() || 'No date'}`
                                });
                            });

                            embeds.push(embed);
                        } catch (error) {
                            console.error(`Error fetching feed ${feedData.feedUrl}:`, error);
                            embeds.push(
                                new EmbedBuilder()
                                    .setTitle('❌ Error fetching feed')
                                    .setDescription(`Failed to fetch feed: ${feedData.feedUrl}`)
                                    .setColor('#ff0000')
                            );
                        }
                    }

                    // Send all embeds
                    await interaction.editReply({
                        content: 'Here are the latest items from all RSS feeds:',
                        embeds: embeds,
                        ephemeral: false
                    });
                } catch (error) {
                    console.error('RSS Check Error:', error);
                    await interaction.reply({
                        content: 'An error occurred while checking RSS feeds.',
                        ephemeral: true
                    });
                }
                break;
        }
    },
};
