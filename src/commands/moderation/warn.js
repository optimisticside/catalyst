const { MessageEmbed } = require("discord.js");

class WarnCommand {
    /**
     * warn command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* format arguments */
        var target = message.mentions.members.first();
        var reason = args.slice(1).join(catalyst.config.SPLIT_KEY) || "Not provided";

        /* throw error if no target provided */
        if (!target) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Warn")
                .setDescription("❗ No user provided")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);
            
            /* send embed and return */
            return message.channel.send(embed);
        }

        /* thrrow error if lacking permissions */
        if (!target.kickable) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Warn")
                .setDescription(`❗ Lacking permissions to warn ${target.user.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* actually warn the user */
        message.channel.send("https://tenor.com/view/discord-meme-spooked-scared-mod-gif-18361254");
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "warn";
        this.description = "Warns a user";
        this.perms = ["MANAGE_GUILD"];
        this.argFormat = ["user"];
    }
};

module.exports = WarnCommand;
