const { MessageEmbed } = require("discord.js");

class PurgeCommand {
    /**
     * purge command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* format arguments */
        var number = parseInt(args[0]);

        /* throw error if no amount provided */
        if (!args[0]) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Purge")
                .setDescription("❗ No amount provided")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);
            
            /* send embed and return */
            return message.channel.send(embed);
        }

        /* throw error if invalid number provided */
        if (!number || isNaN(number)) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Purge")
                .setDescription("❗ Invalid number provided")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);
            
            /* send embed and return */
            return message.channel.send(embed);
        }

        /* throw error if number out of range */
        if (number < 2 || number > 100) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Purge")
                .setDescription("❗ Number out of range")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);
            
            /* send embed and return */
            return message.channel.send(embed);
        }

        /* thrrow error if lacking permissions */
        if (!message.guild.me.hasPermission("MANAGE_MESSAGES")) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Purge")
                .setDescription(`❗ Lacking permissions to purge ${number} messages`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* fetch the messages to delete */
        const toDelete = await message.channel.messages.fetch({ limit: number });

        await message.channel.bulkDelete(toDelete).then(() => {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Purge")
                .setDescription(`✅ Successfully deleted ${number} messages`)
                .setColor(catalyst.config.DEFAULT_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);

        /* handle any errors */
        }).catch(err => {
            /* log to console */
            catalyst.log("Purge command", `Unable to purge ${number} messages: ${err}`);

            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Purge")
                .setDescription(`❗ An error occured when purging ${number} messages`)
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "purge";
        this.description = "Deletes a certain amount of messages from a channel";
        this.aliases = ["bulkDelete"];
        this.perms = ["DELETE_MESSAGES"];
    }
};

module.exports = PurgeCommand;