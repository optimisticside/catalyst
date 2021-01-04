const { RichEmbed } = require("discord.js");

class ErrorsModule {
    /**
     * invalid permissions messaage
     * @param message the message that called the command
     * @param command the command that the user lacked permissions to execute
     */
    async runPerms(message, command) {
        var embed = new RichEmbed()
            .setTitle("Lacking permissions")
            .setColor(this.catalyst.config.FAIL_COLOR)
            .setDesciption(`⚠️ You do not have permissions to use the ${command.name} command!`)
            .setFooter(message.author.tag, message.author.displayAvatarUrl);

        return message.channel.send(embed);
    }

    /**
     * command execution fail message
     * @param message the message tha caused the issue
     * @Param command teh command that failed to execute
     */
    async runFail(message, command) {
        var embed = new RichEmbed()
            .setTitle("Execution fail")
            .setColor(this.catalyst.config.FAIL_COLOR)
            .setDesciption(`❗ I was unable to execute the ${command.name} command!`)
            .setFooter(message.author.tag, message.author.displayAvatarUrl);

        return message.channel.send(embed);
    }

    /**
     * module initialization process
     */
    async init() {
        this.catalyst.log("Errors", "Loaded");
    }

    constructor(catalyst) {
        catalyst.log("Errors", "Loading");
        this.catalyst = catalyst;
    }
};

module.exports = ErrorsModule;