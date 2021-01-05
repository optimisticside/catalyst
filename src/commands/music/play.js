const { MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");

class PlayCommand {
    /**
     * play command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* reconstruct arguments and get vc */
        var url = args.join(catalyst.config.SPLIT_KEY);
        var vc = message.member.voice;

        /* throw error if check if valid url */
        if (!url.match(/(youtube.com|youtu.be)\/(watch)?(\?v=)?(\S+)?/)) {
            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Music")
                .setDescription("❗ Please provide a valid URL to play a song")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* throw error if check if not in vc */
        if (!vc || !vc.channel) {
            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Music")
                .setDescription("❗ Not in a voice-channel")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* get song info and join vc */
        var songInfo = await ytdl.getInfo(url);
        vc.channel.join().then(connection => {
            /* add to queue */
            catalyst.modules.music.queueAdd(message, songInfo.videoDetails.video_url, songInfo.videoDetails.title, connection);

        /* handle errors accordingly */
        }).catch(err => {
            /* log to console */
            catalyst.log("Music command", `Unable to join voice-channel: ${err}`);

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Music")
                .setDescription("❗ Unable to join voice-channel")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "play";
        this.description = "Plays a song";
        this.perms = ["CONNECT", "SPEAK"];
        this.aliases = ["music", "playMusic"];
        this.argFormat = ["youtube-url"];
    }
};

module.exports = PlayCommand;