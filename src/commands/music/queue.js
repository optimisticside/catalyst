const { MessageEmbed } = require("discord.js");

class QueueCommand {
    /**
     * play command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* get music info for guild */
        var musicInfo = catalyst.modules.music.data[message.guild.id];

        /* throw error if no data */
        if (!musicInfo) {
            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Music")
                .setDescription("❗ There is no queue for music right now")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed */
            message.channel.send(embed);
        }

        /* get queue data */
        var queueData = [];

        /* add all queue elements to array */
        musicInfo.queue.data.forEach(element => {
            queueData.push(element.title);
        });

        /* create embed */
        const embed = new MessageEmbed()
            .setTitle("Music queue")
            .setDescription(queueData.join("\n"))
            .setColor(catalyst.config.DEFAULT_COLOR)
            .setFooter(message.author.tag, message.author.displayAvatarURL);

        /* send embed */
        message.channel.send(embed);
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "queue";
        this.description = "Gets the music queue";
        this.aliases = ["getQueue", "musicQueue"];
    }
};

module.exports = QueueCommand;