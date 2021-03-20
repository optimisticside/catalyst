const { MessageEmbed } = require("discord.js");
const got = require("got");

class CatCommand {
    /**
     * cat command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        got("https://aws.random.cat/meow").then(res => {
            const content = JSON.parse(res.body);
            const url = content.file;

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Cat")
                .setURL(url)
                .setImage(url)
                .setColor(catalyst.config.DEFAULT_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);

        /* handle errors accordingly */
        }).catch(err => {
            /* log to console */
            catalyst.log("Cat command", `Unable to make request to API: ${err}`);

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Cat")
                .setDescription("❗ Unable to retrieve random cat from API")
                .setColor(this.catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "cat";
        this.description = "Gets a random image of a cat";
        this.aliases = ["getCat", "meow"];
    }
};

module.exports = CatCommand;