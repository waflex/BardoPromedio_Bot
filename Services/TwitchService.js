const { ApiClient } = require("@twurple/api");
const { AppTokenAuthProvider } = require("@twurple/auth");
const Streamer = require("../Models/Streamer");
const { EmbedBuilder } = require("discord.js");

class TwitchService {
  constructor(client) {
    this.client = client;
    this.checkInterval = 2 * 60 * 1000; // 2 minutes
    this.apiClient = null;
    this.initializeTwitchApi();
  }

  initializeTwitchApi() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Twitch credentials not configured");
    }

    const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
    this.apiClient = new ApiClient({ authProvider });
  }

  start() {
    setInterval(() => this.checkStreamers(), this.checkInterval);
    console.log("TwitchService started - Checking streamers every 2 minutes");
  }

  async checkStreamers() {
    const streamers = await Streamer.find({});

    for (const streamer of streamers) {
      try {
        const stream = await this.apiClient.streams.getStreamByUserId(
          streamer.twitchUserId
        );
        const wasLive = streamer.isLive;
        const isNowLive = !!stream;

        if (!wasLive && isNowLive) {
          // Streamer just went live
          const channel = this.client.channels.cache.get(streamer.channelId);
          if (channel) {
            const user = await this.apiClient.users.getUserById(
              streamer.twitchUserId
            );
            const embed = new EmbedBuilder()
              .setColor("#6441a5")
              .setTitle(`¡${user.displayName} está en vivo!`)
              .setURL(`https://twitch.tv/${user.name}`)
              .setThumbnail(user.profilePictureUrl)
              .addFields(
                {
                  name: "Jugando",
                  value: stream.gameName || "Sin categoría",
                  inline: true,
                },
                {
                  name: "Viewers",
                  value: stream.viewers.toString(),
                  inline: true,
                }
              )
              .setImage(
                stream.getThumbnailUrl().replace("{width}x{height}", "1280x720")
              )
              .setDescription(stream.title)
              .setTimestamp()
              .setFooter({ text: "🎮 Stream Iniciado" });

            await channel.send({
              content: `¡**${user.displayName}** está en vivo! @here`,
              embeds: [embed],
            });

            // Update streamer status in database
            streamer.isLive = true;
            streamer.lastLiveAt = new Date();
            await streamer.save();
          }
        } else if (wasLive && !isNowLive) {
          // Streamer went offline
          streamer.isLive = false;
          await streamer.save();
          console.log(
            `Streamer ${streamer.twitchUsername} ha terminado su stream.`
          );
        }
    console.log(`Streamer ${streamer.twitchUsername} está ${isNowLive ? "en vivo" : "offline"}.`);
      } catch (error) {
        console.error(
          `Error checking streamer ${streamer.twitchUsername}:`,
          error
        );
      }
    }
  }

  async testStreamer(twitchUsername) {
    try {
      const streamer = await Streamer.findOne({ twitchUsername });
      if (!streamer) {
        console.log("❌ Streamer no encontrado en la base de datos");
        return;
      }
      const stream = await this.apiClient.streams.getStreamByUserId(
        streamer.twitchUserId
      );
      const user = await this.apiClient.users.getUserById(
        streamer.twitchUserId
      );

      console.log("📊 Datos de Twitch:", {
        isLive: !!stream,
        streamTitle: stream?.title,
        viewers: stream?.viewers,
        displayName: user?.displayName,
        profileUrl: user?.profilePictureUrl,
      });
      console.log(await stream);

      return { streamer, stream, user };
    } catch (error) {
      console.error("❌ Error en test:", error);
      throw error;
    }
  }
}

module.exports = TwitchService;
