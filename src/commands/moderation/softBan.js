const { MessageEmbed } = require("discord.js");

class SoftBanCommand {
    /**
     * ban command
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
                .setTitle("Soft ban")
                .setDescription("❗ No user provided")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);
            
            /* send embed and return */
            return message.channel.send(embed);
        }

        /* thrrow error if lacking permissions */
        if (!target.bannable) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Soft ban")
                .setDescription(`❗ Lacking permissions to soft-ban ${target.user.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* ban the user */
        await target.ban({ reason: reason }).then(() => {
            message.guild.members.unban(message.author).then(() => {
                /* create embed */
                var embed = new MessageEmbed()
                    .setTitle("Ban")
                    .setDescription(`✅ Successfully soft-banned ${target.user.tag}`)
                    .setColor(catalyst.config.DEFAULT_COLOR)
                    .setFooter(message.author.tag, message.author.displayAvatarURL);

                /* send embed and return */
                return message.channel.send(embed);

            /* handle any errors */
            }).catch(err => {
                /* log to console */
                catalyst.log("SoftBan command", `Unable to unban ${target.user.tag}: ${err}`);

                /* create embed */
                var embed = new MessageEmbed()
                    .setTitle("Soft ban")
                    .setDescription(`❗ An error occured when unbanning ${target.user.tag}`)
                    .setColor(catalyst.config.FAIL_COLOR)
                    .setFooter(message.author.tag, message.author.displayAvatarURL);

                /* send embed and return */
                return message.channel.send(embed);
            });

        /* handle any errors */
        }).catch(err => {
            /* log to console */
            catalyst.log("SoftBan command", `Unable to ban ${target.user.tag}: ${err}`);

            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Soft ban")
                .setDescription(`❗ An error occured when banning ${target.user.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "softBan";
        this.description = "Bans a user, and then unbans them to clear their messages";
        this.perms = ["BAN_MEMBERS"];
        this.aliases = ["sb"];
        this.argFormat = ["user", "reason"];
    }
};

module.exports = SoftBanCommand;