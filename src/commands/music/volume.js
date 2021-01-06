const { MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");

class VolumeCommand {
    /**
     * volume command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* get input and vc */
        var volume = parseFloat(args[0]);
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

        /* throw error if check if not number */
        if (!volume || isNaN(volume)) {
            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Music")
                .setDescription("❗ Invalid number provided")
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
        musicData.dispatcher.setVolume(volume);
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "volume";
        this.description = "Changes the volume of the currently-playing song";
        this.perms = ["CONNECT", "SPEAK"];
        this.aliases = ["setVolume"];
    }
};

module.exports = VolumeCommand;