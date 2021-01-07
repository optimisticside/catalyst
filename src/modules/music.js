const Queue = require("../util/queue.js");
const ytdl = require("ytdl-core");
const { MessageEmbed } = require("discord.js");

class MusicModule {
    /**
     * adds a song to a queue
     * @param message the message that was sent to add the song to the queu
     * @param url the url of the song
     * @param title the title/name of the song to play
     * @param connection the connection (if any) to play through
     */
    async queueAdd(message, url, title, connection) {
        /* make sure the queue exists */
        if (!this.data[message.guild.id]) {
            this.data[message.guild.id] = {
                textChannel: message.channel,
                voiceChannel: message.member.vc,
                connection: connection || null,
                queue: new Queue(),
                volume: 5,
                running: false,
            };
        }

        /* add data to end of queue */
        var musicData = this.data[message.guild.id];
        musicData.queue.push({ id: message.author.id, url: url, title: title });

        /* run music player if not on right now */
        if (!musicData.running) {
            this.runQueue(message.guild.id, musicData);
        }
    }

    /**
     * runs the queue and plays songs accordingly
     * @param musicData the music data about the queue
     */
    async runQueue(guildId, musicData) {
        /* get next song in queue */
        musicData.running = true;
        var toPlay = musicData.queue.pop();

        /* destroy queue if no music left to play */
        if (!toPlay) {
            this.data[guildId] = null;
            return;
        }

        /* display new song in queue in channel */
        if (musicData.textChannel) {
            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Music")
                .setDescription(`Now playing ${toPlay.title}`)
                .setColor(this.catalyst.config.DEFAULT_COLOR);

            /* send embed */
            musicData.textChannel.send(embed);
        }

        /* start playing music */
        musicData.dispatcher = musicData.connection.play(ytdl(toPlay.url, { filter: "audioonly" }), { quality: "highestaudio", bitrate: "auto" }).on("end", () => {
            /* recursively call function to play next song */
            this.runQueue(guildId, musicData);

        /* handle errors accordingly */
        }).on("error", err => {
            /* log to console */
            this.catalyst.log("Music", `Unable to play URL ${toPlay.url}: ${err}`);

            /* throw error */
            this.catalyst.modules.errors.musicPlay(musicData.textChannel, toPlay.url);
        });
    }

    /**
     * module initialization process
     */
    async init() {
        this.catalyst.log("Music", "Loaded");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;
        this.data = {};
    }
};

module.exports = MusicModule;