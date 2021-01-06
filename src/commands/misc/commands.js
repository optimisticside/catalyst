const { MessageEmbed } = require("discord.js");

class CommandsCommand {
    /**
     * gets categories of commands
     * @returns the organized data
     */
    async getCommands() {
        /* initialize dictionary */
        var data = {};
    
        for (var [category, commands] of Object.entries(this.catalyst.modules.commands.commandsTree)) {
            /* initialize index */
            data[category] = [];

            /* add commands */
            for(var [index, command] of Object.entries(commands || {})) {
                if (command.name) {
                    data[category][data[category].length] = command.name;
                }
            };
        }

        return data;
    }

    /**
     * commands command
     * @param catalyst the framework
     * @param message the message that called the command
     * @param args any arguments provided in the message
     */
    async run(catalyst, message, args) {
        var data = await this.getCommands();

        /* create embed */
        var embed = new MessageEmbed()
            .setTitle("Commands")
            .setColor(catalyst.config.DEFAULT_COLOR)
            .setFooter(message.author.tag, message.author.displayAvatarURL);

        /* add data */
        for (var [category, commands] of Object.entries(data)) {
            embed.addField(category, ((commands && commands.length > 0) ? commands.join("\n") : "None"), true);
        }

        /* send embed */
        message.channel.send(embed);
    };

    constructor(catalyst) {
        this.catalyst = catalyst;

        /* command info */
        this.name = "commands";
        this.description = "Displays a list of commands";
        this.aliases = ["c", "cmds", "viewCmds"];
    }
};

module.exports = CommandsCommand;