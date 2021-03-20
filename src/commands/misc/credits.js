const { MessageEmbed } = require("discord.js");

class CreditsCommand {
    /**
     * credits ncommand
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* create embed */
        const embed = new MessageEmbed()
            .setTitle("Credits")
            .setDescription(`My name is ${catalyst.config.NAME} and I was created by ${catalyst.config.CREATOR}! For more information about me, visit ${catalyst.config.WEBSITE_URL}.`)
            .setColor(catalyst.config.DEFAULT_COLOR)
            .setFooter(message.author.tag, message.author.displayAvatarURL);

        /* send embed */
        message.channel.send(embed);
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "credits";
        this.description = `Gets the bot's credits`;
        this.aliases = ["credit", "getCredits", "getCredit"];
    }
};

module.exports = CreditsCommand;