const { MessageEmbed } = require("discord.js");

class BanCommand {
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
            var embed = new MessageEmbed()
                .setTitle("Ban")
                .setDescription("❗ No user provided.")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);
            
            return message.channel.send(embed);
        }

        /* thrrow error if lacking permissions */
        if (!target.bannable) {
            var embed = new MessageEmbed()
                .setTitle("Ban")
                .setDescription(`❗ Lacking permissions to ban ${target.user.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            return message.channel.send(embed);
        }

        /* ban the user */
        await target.ban(reason).then(() => {
            var embed = new MessageEmbed()
                .setTitle("Ban")
                .setDescription(`✔️ Successfully banned ${target.user.tag}`)
                .setColor(catalyst.config.DEFAULT_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            return message.channel.send(embed);

        /* handle any errors */
        }).catch(err => {
            var embed = new MessageEmbed()
                .setTitle("Ban")
                .setDescription(`❗ An error occured when banning ${target.user.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            return message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        this.name = "ban";
        this.description = "Bans a user";
        this.perms = ["BAN_MEMBERS"];
        this.aliases = ["banHammer", "abolish"];
        this.argFormat = ["user", "reason"];
    }
};

module.exports = BanCommand;