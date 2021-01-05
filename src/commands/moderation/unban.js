const { MessageEmbed } = require("discord.js");

class UnbanCommand {
    /**
     * ban command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* format arguments */
        var target = message.mentions.members.first() || await catalyst.client.users.fetch(args[0]);
        var reason = args.slice(1).join(catalyst.config.SPLIT_KEY) || "Not provided";
        console.log(target, args[0]);

        /* throw error if no target provided */
        if (!target) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Unban")
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
                .setTitle("Unban")
                .setDescription(`❗ Lacking permissions to unban ${target.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* ban the user */
        await message.guild.members.unban(user, reason).then(() => {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Unbanned")
                .setDescription(`✅ Successfully unbanned ${target.tag}`)
                .setColor(catalyst.config.DEFAULT_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);

        /* handle any errors */
        }).catch(err => {
            /* log to console */
            catalyst.log("Unban command", `Unable to unban ${target.tag}: ${err}`);

            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Unban")
                .setDescription(`❗ An error occured when unbanning ${target.tag}`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "unban";
        this.description = "Unbans a user";
        this.perms = ["BAN_MEMBERS"];
        this.argFormat = ["user", "reason"];
    }
};

module.exports = UnbanCommand;