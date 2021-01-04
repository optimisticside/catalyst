const { MessageEmbed } = require("discord.js");

class EightBallCommand {
    /**
     * 8ball command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* choose a response */
        const response = this.options[Math.floor(Math.random() * this.options.length)];

        /* create embed */
        const embed = new MessageEmbed()
            .setTitle("8Ball")
            .setDescription(`🎱 ${response}`)
            .setColor(this.catalyst.config.DEFAULT_COLOR)
            .setFooter(message.author.tag, message.author.displayAvatarURL);
        
        /* actually send message */
        message.channel.send(embed);
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        this.name = "8ball";
        this.description = "Asks the 8ball a question";
        this.aliases = ["eightBall"];
        this.argFormat = ["message"];

        this.options = ["yes", "no", "maybe", "perhaps", "obviously", "what do you think?"];
    }
};

module.exports = EightBallCommand;