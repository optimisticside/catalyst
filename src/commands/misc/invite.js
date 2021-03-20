const { MessageEmbed } = require("discord.js");

class InviteCommand {
    /**
     * invite ncommand
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* create embed */
        const embed = new MessageEmbed()
            .setTitle("Invite")
            .setURL(catalyst.config.INVITE_URL)
            .setDescription("Here's the link to invite me")
            .setColor(catalyst.config.DEFAULT_COLOR)
            .setFooter(message.author.tag, message.author.displayAvatarURL);

        /* send embed */
        message.channel.send(embed);
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "invite";
        this.description = `Gets the link to invite ${catalyst.config.NAME} to your server`;
        this.aliases = ["getInvite"];
    }
};

module.exports = InviteCommand;