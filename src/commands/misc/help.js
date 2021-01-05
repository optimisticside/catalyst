const { MessageEmbed } = require("discord.js");
const mathjs = require("mathjs");

class HelpCommand {
    /**
     * gets the usage for a command
     * @param command the command to get the usage of
     * @example !kick <user> <reason>
     * @returns the command's usage
     */
    async getUsage(command) {
        /* handle prefix and call */
        var usage = `${this.catalyst.config.PREFIX}${command.name}`;

        /* handle arguments */
        if (command.argFormat) {
            command.argFormat.forEach(arg => {
                usage += ` <${arg}>`;
            });
        }

        return usage;
    }

    /**
     * command help command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async commandHelp(catalyst, message, args) {
        /* find command */
        var command = await catalyst.modules.commands.findCommand(args[0]);

        /* throw error if not found */
        if (!command) {
            /* create embed */
            const embed = new MessageEmbed()
                .setTitle("Help")
                .setDescription("❗ Unable to find command")
                .setColor(catalyst.config.FAIL_COLOR)
                .setFooter(message.author.tag, message.author.displayAvatarURL);

            /* send embed and return */
            return message.channel.send(embed);
        }

        /* create embed */
        const embed = new MessageEmbed()
            .setTitle("Command help")
            .setDescription(command.description || "No description")
            .setColor(catalyst.config.DEFAULT_COLOR)
            .addField("Usage", `\`${await this.getUsage(command)}\``)
            .addField("Aliases", (command.aliases ? command.aliases.join("\n") : "None"))
            .setFooter(message.author.tag, message.author.displayAvatarURL);

        /* send embed */
        message.channel.send(embed);
    }

    /**
     * help command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        /* call function if requesting command help */
        if (args.length > 0) {
            return this.commandHelp(catalyst, message, args);
        }

        /* create embed */
        const embed = new MessageEmbed()
            .setTitle(`${catalyst.config.NAME} help`)
            .setDescription(`For a list of commands, try \`${catalyst.config.PREFIX}commands\`\n\nFor help about a specific command, use \`${catalyst.config.PREFIX}help <command>\``)
            .setColor(catalyst.config.DEFAULT_COLOR)
            .setFooter(message.author.tag, message.author.displayAvatarURL);

        /* send embed */
        message.channel.send(embed);
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "help";
        this.description = "Displays helpful information";
        this.aliases = ["getHelp", "helpMe"];
        this.argFormat = ["equation"];
    }
};

module.exports = HelpCommand;