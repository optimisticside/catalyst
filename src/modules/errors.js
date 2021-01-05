const { MessageEmbed } = require("discord.js");

class ErrorsModule {
    /**
     * invalid permissions messaage
     * @param message the message that called the command
     * @param command the command that the user lacked permissions to execute
     */
    async userPerms(message, command) {
        const embed = new MessageEmbed()
            .setTitle("Lacking permissions")
            .setColor(this.catalyst.config.FAIL_COLOR)
            .setDescription(`⚠️ You do not have permissions to use the ${command.name} command!`)
            .setFooter(message.author.tag, message.author.displayAvatarUrl);

        return message.channel.send(embed);
    }

    /**
     * invalid bot permissions messaage
     * @param message the message that called the command
     * @param command the command that the user lacked permissions to execute
     */
    async botPerms(message, command) {
        const embed = new MessageEmbed()
            .setTitle("Lacking permissions")
            .setColor(this.catalyst.config.FAIL_COLOR)
            .setDescription(`⚠️ I do not have permissions to use the ${command.name} command!`)
            .setFooter(message.author.tag, message.author.displayAvatarUrl);

        return message.channel.send(embed);
    }

    /**
     * cooldown messaage
     * @param message the message that called the command
     * @param command the command that the user is still on cooldown for
     * @param cooldown the time remaining in the cooldown
     */
    async cooldown(message, command, cooldown) {
        const embed = new MessageEmbed()
            .setTitle("On cooldown")
            .setColor(this.catalyst.config.FAIL_COLOR)
            .setDescription(`⚠️ You're still on cooldown for the ${command.name} command! Please wait ${Math.round(cooldown/10)/100} more seconds.`)
            .setFooter(message.author.tag, message.author.displayAvatarUrl);

        return message.channel.send(embed);
    }

    /**
     * command execution fail message
     * @param message the message tha caused the issue
     * @param command teh command that failed to execute
     */
    async runFail(message, command) {
        const embed = new MessageEmbed()
            .setTitle("Execution fail")
            .setColor(this.catalyst.config.FAIL_COLOR)
            .setDescription(`❗ Unable to execute the ${command.name} command`)
            .setFooter(message.author.tag, message.author.displayAvatarUrl);

        return message.channel.send(embed);
    }

    /**
     * invalid command message
     * @param message the message tha caused the issue
     * @param call the command call for the command that wasn't found
     */
    async invalidCommand(message, call) {
        const embed = new MessageEmbed()
            .setTitle("Invalid command")
            .setColor(this.catalyst.config.FAIL_COLOR)
            .setDescription(`❗ Invalid command provided`)
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
        this.catalyst = catalyst;
    }
};

module.exports = ErrorsModule;