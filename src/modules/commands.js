class CommandsModule {
    /**
     * adds a command to the commands table
     * @param command the command to add
    */
    async addCommand(command) {
        /* ensure that the command has a name */
        if (command.name) {
            /* add the command */
            this.commands[command.name] = command;
        }
    }

    /**
     * finds a command from a call
     * @param call the call to search commands for
     * @returns the command found (if any)
     */
    async findCommand(call) {
        /* make call lower-case so we don't have to every time */
        call = call.toLowerCase();

        /* go through commands */
        for (var [name, command] in Object.entries(this.commands)) {
            /* check command's name */
            if (command.name.toLowerCase() == call) {
                return command;

            /* check command's aliases */
            } else if (command.aliases) {
                /* go through aliases */
                for (var i = 0; i < command.aliases.length; i++) {
                    /* check aliase */
                    if (command.aliases[i].toLowerCase() == call) {
                        return command;
                    }
                }
            }
        }
    }

    /**
     * runs a command
     * @param the command to run
     * @param message the message sent to run the command
     * @param args the arguments to be passed to the command
     * @returns whether or not the execution was a success, along with the result / error-message
     */
    async runCommand(command, message, args) {
        /* run command */
        return command.run(this, message, args).then((...result) => {
            /* execution was a success */
            return true, result;
        
        }).catch(err => {
            /* execution was a failure */
            return false, err;
        });
    }

    /**
     * checks a guild member's permissions
     * @param member the guild member to check the permissions of
     * @param perms the permissions to check the user for
     * @returns whether or not the user has the permissions
     */
    async checkPerms(member, perms) {
        /* assume permissions to be valid (in-case there are no permissions) */
        var hasPerms = true;

        /* go through permissions */
        for (var i = 0; i < perms.length; i++) {
            var perm = perms[i];

            /* check permission */
            if (perm && !member.permissions.find(perm)) {
                hasPerms = false;
            }
        }

        return hasPerms;
    }

    /**
     * handles a user's message
     * @param message the message sent
     */
    async handleMessage(message) {
        /* return if message was not part of a guild or was a bot */
        if (!message.guild) return;
        if (message.author.bot) return;

        // var userData, guildData = this.catalyst.dataBase.getData(message);
        var prefixes = [`<@${this.catalyst.client.user.id}>`]//.concat(guildData.prefix);
        var prefix = null;

        /* validate prefix */
        for (var prefix of prefixes) {
            if (message.content.startsWith(prefix)) {
                prefix = prefix;
            }
        }

        /* return if not a command */
        if (!prefix) return;

        /* parse message and get args and command call */
        var args = message.content.trim().split(this.catalyst.config.splitKey);
        var call = args.shift().toLowerCase();

        /* get command and validte user's permissions */
        var command = await this.findCommand(call);
        var hasPerms = await this.checkPerms(message.member, command.perms || {});

        /* throw error if user doesn't have permissions */
        if (!hasPerms) {
            this.catalyst.errors.runPerms(message, command);
            return;
        }

        /* execute command and throw error if execution fails */
        var ran, result = this.runCommand(user, message, args);
        if (!ran) {
            this.catalyst.errors.runFail(user, command);
        }
    }

    /**
     * sets up the commands
     */
    async setupCommands() {
        return await this.catalyst.setupDirectory("../commands", this.commands, [".js", ".mjs"]);
    }

    /**
     * module initialization process
     */
    async init() {
        this.setupCommands();
        this.catalyst.log("Events", "Loaded");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;
        this.commands = {};

        catalyst.commands = this.commands;
    }
};

module.exports = CommandsModule;