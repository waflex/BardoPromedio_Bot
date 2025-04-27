const RssFeed = require('../Models/RssFeed');
const Parser = require('rss-parser');
const parser = new Parser();

class RssService {
    constructor(client) {
        this.client = client;
        this.checkInterval = 5 * 60 * 1000; // 5 minutes
    }

    start() {
        setInterval(() => this.checkFeeds(), this.checkInterval);
    }

    async checkFeeds() {
        const feeds = await RssFeed.find({});
        
        for (const feed of feeds) {
            try {
                const parsedFeed = await parser.parseURL(feed.feedUrl);
                const latestItem = parsedFeed.items[0];

                if (latestItem.guid !== feed.lastItemGuid) {
                    const channel = this.client.channels.cache.get(feed.channelId);
                    if (channel) {
                        const embed = {
                            color: 0x0099ff,
                            title: latestItem.title,
                            url: latestItem.link,
                            author: {
                                name: parsedFeed.title,
                                icon_url: parsedFeed.image?.url
                            },
                            description: latestItem.contentSnippet?.slice(0, 200) + '...' || 'No description available',
                            thumbnail: {
                                url: latestItem.enclosure?.url || parsedFeed.image?.url
                            },
                            timestamp: new Date(latestItem.isoDate),
                            footer: {
                                text: '🔔 Nuevo Contenido'
                            }
                        };

                        await channel.send({ embeds: [embed] });

                        feed.lastItemGuid = latestItem.guid;
                        feed.lastChecked = new Date();
                        await feed.save();
                    }
                }
            } catch (error) {
                console.error(`Error checking feed ${feed.feedUrl}:`, error);
            }
        }
    }
}

module.exports = RssService;