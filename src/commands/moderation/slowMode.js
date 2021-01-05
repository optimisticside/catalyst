const { MessageEmbed } = require("discord.js");

class SlowmodeCommand {
    /**
     * slowmode command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        var rateLimit = parseInt(args[0]) || 0;

        /* throw error if not a number */
        if (isNaN(rateLimit)) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Slowmode")
                .setDescription(`❗ Please provide a number if enabling slowmode`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* set rate limit */
        message.channel.setRateLimitPerUser(rateLimit).then(() => {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Slowmode")
                .setDescription(`✅ Successfully set rate limit to ${rateLimit} seconds`)
                .setColor(catalyst.config.DEFAULT_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);

        /* handle errors accordingly */
        }).catch(err => {
            /* log to console */
            catalyst.log("Slowmode command", `Unable to set rate limit to ${rateLimit} seconds: ${err}`);

            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Slowmode")
                .setDescription(`❗ An error occured when changing rate limit to ${rateLimit} seconds`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "slowmode";
        this.description = "Toggles slowmode in a channel";
        this.perms = ["MANAGE_CHANNEL"];
        this.aliases = ["setSlowmode"];
    }
};

module.exports = SlowmodeCommand;