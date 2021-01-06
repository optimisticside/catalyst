const { MessageEmbed } = require("discord.js");
const got = require("got");

class MemeCommand {
    /**
     * meme command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        got("https://www.reddit.com/r/memes/random/.json").then(res => {
            const content = JSON.parse(res.body);
            const post = content[0].data.children[0].data;
            const url = `https://reddit.com/${post.permalink}`;

            /* post info */
            const image = post.url;
            const title = post.title;
            const upVotes = post.ups;
            const comments = post.num_comments;

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle(title)
                .setURL(url)
                .setImage(image)
                .setFooter(`👍 ${upVotes} 💬 ${comments}`);

            /* send embed */
            message.channel.send(embed);

        /* handle errors accordingly */
        }).catch(err => {
            /* log to console */
            catalyst.log("Meme command", `Unable to make request to Reddit: ${err}`);

            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Meme")
                .setDescription("❗ Unable to retrieve random meme from Reddit")
                .setColor(this.catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);
        });
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "meme";
        this.description = "Gets a meme from r/DankMemes";
        this.aliases = ["m", "getMeme"];
    }
};

module.exports = MemeCommand;