const { MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");

class SkipCommand {
    /**
     * skip command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* get vc */
        var vc = message.member.voice;

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

        /* get music data */
        var musicData = catalyst.modules.music.data[message.guild.id];

        /* throw error if not playing anything */
        if (!musicData || !musicData.running || !musicData.dispatcher) {
            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Music")
                .setDescription("❗ Nothing is currently playing")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* pause dispatcher */
        musicData.dispatcher.pause();
        catalyst.modules.music.runQueue(message.guild.id, musicData).catch(err => {
            /* log to console */
            catalyst.log("Skip command", `Unable to skip song: ${err}`);

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Music")
                .setDescription("❗ Unable to skip song")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "skip";
        this.description = "Skips the currently-playing song";
        this.perms = ["CONNECT", "SPEAK"];
        this.aliases = ["skipMusic"];
    }
};

module.exports = SkipCommand;