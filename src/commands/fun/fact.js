const { MessageEmbed } = require("discord.js");
const got = require("got");

class FactCommand {
    /**
     * fact command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        got("https://uselessfacts.jsph.pl/random.json?language=en").then(res => {
            const content = JSON.parse(res.body);
            const fact = content.text;

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Fact")
                .setDescription(fact)
                .setColor(catalyst.config.DEFAULT_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);

        /* handle errors accordingly */
        }).catch(err => {
            /* log to console */
            catalyst.log("Fact command", `Unable to make request to API: ${err}`);

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Fact")
                .setDescription("❗ Unable to retrieve random fact from API")
                .setColor(this.catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "fact";
        this.description = "Gets a random useless fact";
        this.aliases = ["funFact"];
    }
};

module.exports = FactCommand;