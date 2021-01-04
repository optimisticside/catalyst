const { MessageEmbed } = require("discord.js");
const got = require("got");

class DogCommand {
    /**
     * dog command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        got("https://dog.ceo/api/breeds/image/random").then(res => {
            const content = JSON.parse(res.body);
            const url = content.message;

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Dog")
                .setURL(url)
                .setImage(url)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);

        /* handle errors accordingly */
        }).catch(err => {
            /* log to console */
            catalyst.log("Dog command", `Unable to make request to API: ${err}`);

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Dog")
                .setDescription("❗ Unable to retrieve random dog from API")
                .setColor(this.catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "dog";
        this.description = "Gets a random image of a dog";
        this.aliases = ["getDog", "woof"];
    }
};

module.exports = DogCommand;