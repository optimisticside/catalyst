const { MessageEmbed } = require("discord.js");

class KickCommand {
    /**
     * kick command
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
            var embed = new MessageEmbed()
                .setTitle("Kick")
                .setDescription("❗ No user provided.")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);
            
            return message.channel.send(embed);
        }

        /* thrrow error if lacking permissions */
        if (!target.kickable) {
            var embed = new MessageEmbed()
                .setTitle("Kick")
                .setDescription(`❗ Lacking permissions to kick ${target.user.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            return message.channel.send(embed);
        }

        /* kick the user */
        await target.kick(reason).then(() => {
            var embed = new MessageEmbed()
                .setTitle("Kick")
                .setDescription(`✔️ Successfully kicked ${target.user.tag}`)
                .setColor(catalyst.config.DEFAULT_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            return message.channel.send(embed);

        /* handle any errors */
        }).catch(err => {
            var embed = new MessageEmbed()
                .setTitle("Kick")
                .setDescription(`❗ An error occured when kicking ${target.user.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            return message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        this.name = "kick";
        this.description = "Kicks a user";
        this.perms = ["KICK_MEMBERS"];
        this.aliases = ["yeet"];
        this.argFormat = ["user", "reason"];
    }
};

module.exports = KickCommand;