const { MessageEmbed } = require("discord.js");
const mathjs = require("mathjs");

class MathCommand {
    /**
     * evaluates a math equation in a promise
     * @param equation the equation to evaluate
     * @returns the evaluation result
     */
    async evaluate(equation) {
        return mathjs.evaluate(equation);
    }

    /**
     * math command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        const equation = args.join(catalyst.config.SPLIT_KEY);

        /* evaluate the equation */
        this.evaluate(equation).then(res => {
            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Math")
                .setDescription(`Result: ${res}`)
                .setColor(catalyst.config.DEFAULT_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);

        /* handle errors accordingly */
        }).catch(err => {
            /* log in console */
            catalyst.log("Math command", `Unable to evaluate equation "${equation}: ${err}`);            

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Math")
                .setDescription("❗ Unable to evaluate equation")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "math";
        this.description = "Evalutes a math equation";
        this.aliases = ["doPath"];
        this.argFormat = ["equation"];
    }
};

module.exports = MathCommand;