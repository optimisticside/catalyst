const { MessageEmbed } = require("discord.js");

class DankrateCommand {
    /**
     * calculates a user's dank rate
     * @param member the member to calcuate the dank rate of
     * @returns the calculated result
     */
    async calculateDankrate(member) {
        return Math.floor(Math.random() * 100);
    }

    /**
     * dankrate command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* format arguments */
        var target = message.mentions.members.first();

        /* throw error if no target provided */
        if (!target) {
            /* create embed */
            var embed = new MessageEmbed()
                .setTitle("Dankrate")
                .setDescription("❗ No user provided")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);
            
            /* send embed and return */
            return message.channel.send(embed);
        }

        /* do calculation */
        var dankrate = await this.calculateDankrate(message.member);

        /* create embed */
        var embed = new MessageEmbed()
            .setTitle("Dankrate")
            .setDescription(`🅱️ ${target.user.tag} is ${dankrate}% dank`)
            .setColor(catalyst.config.DEFAULT_COLOR)
            .setFooter(message.author.tag, message.author.displayAvatarURL);

        /* send embed */
        message.channel.send(embed);
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "dankrate";
        this.description = "Determines how dank a user is (totally accurate)";
        this.argFormat = ["user"];
    }
};

module.exports = DankrateCommand;