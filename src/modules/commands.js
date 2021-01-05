class CommandsModule {
    /**
     * adds a command to the commands table
     * @param command the command to add
    */
    async addCommand(command) {
        /* ensure that the command has a name */
        if (command.name) {
            /* add the command */
            this.catalyst.log("Commands", `Adding ${command.name} command`);
            this.commands[this.commands.length] = command;
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
        for (var i = 0; i < this.commands.length; i++) {
            /* get command */
            var command = this.commands[i];

            /* check command's name */
            if (command.name && command.name.toLowerCase() == call) {
                return command;

            /* check command's aliases */
            } else if (command.aliases && command.aliases != []) {
                /* go through aliases */
                for (var j = 0; j < command.aliases.length; j++) {
                    /* check aliase */
                    if (command.aliases[j].toLowerCase() == call) {
                        return command;
                    }
                }
            }
        }
    }

    /**
     * runs a command
     * @param command the command to run
     * @param message the message sent to run the command
     * @param args the arguments to be passed to the command
     * @returns whether or not the execution was a success, along with the result / error-message
     */
    async runCommand(command, message, args) {
        /* run command */
        await command.run(this.catalyst, message, args)
    }

    /**
     * saves a member's cooldown for a command
     * @param member the guild member to add a cooldown for
     * @param command the command that the member ran
     */
    async saveCooldown(member, command) {
        /* create a cooldown table if one does not exist */
        if (!this.cooldowns[member.user.id]) {
            this.cooldowns[member.user.id] = {}
        }

        /* add cooldown */
        this.cooldowns[member.user.id][command.name] = Date.now();
    }

    /**
     * determines whether or not a member is on cooldown for a command
     * @param member the guild member to get the cooldown for
     * @param command the command that the member ran
     * @returns whether or not the member is still on cooldown
     */
    async onCooldown(member, command) {
        /* create a cooldown table if one does not exist */
        if (!this.cooldowns[member.user.id]) {
            this.cooldowns[member.user.id] = {}
        }

        /* get cooldown */
        var cooldown = this.cooldowns[member.user.id][command.name];
        return (!cooldown ? false : Date.now() - cooldown <= (command.cooldown || this.catalyst.config.COOLDOWN));
    }

    /**
     * determines whether or not a member is on cooldown for a command
     * @param member the guild member to get the cooldown for
     * @param command the command that the member ran
     * @returns the ms left in the member's cooldown
     */
    async getCooldown(member, command) {
        /* create a cooldown table if one does not exist */
        if (!this.cooldowns[member.user.id]) {
            this.cooldowns[member.user.id] = {}
        }

        /* get cooldown */
        var cooldown = this.cooldowns[member.user.id][command.name];
        var timeLeft = (command.cooldown || this.catalyst.config.COOLDOWN) - (Date.now() - cooldown);
        return timeLeft;
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
            if (perm && !member.hasPermission(perm)) {
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
        var messageText = message.content.trim();
        var prefixes = [`<@${this.catalyst.client.user.id}>`, `<@!${this.catalyst.client.user.id}>`, this.catalyst.config.PREFIX]//.concat(guildData.prefix);
        var prefix = null;

        /* validate prefix */
        prefixes.forEach(p => {
            if (messageText.startsWith(p)) {
                messageText = messageText.slice(p.length)
                prefix = p;
            }
        });

        /* return if not a command */
        if (!prefix) return;

        /* parse message and get args and command call */
        var args = messageText.trim().split(this.catalyst.config.SPLIT_KEY);
        var call = args.shift().toLowerCase();

        /* get command */
        var command = await this.findCommand(call);

        /* throw error if invalid command */
        if (!command) {
            this.catalyst.modules.errors.invalidCommand(message, call);
            return;
        }

        /* validate user's permissions */
        var userHasPerms = await this.checkPerms(message.member, command.perms || []);
        var botHasPerms = await this.checkPerms(message.guild.me, command.perms || []);

        /* throw error if user doesn't have permissions */
        if (!userHasPerms) {
            this.catalyst.modules.errors.userPerms(message, command);
            return;
        }

        /* throw error if bot doesn't have permissions */
        if (!botHasPerms) {
            this.catalyst.modules.errors.botPerms(message, command);
            return;
        }

        /* throw error if user is on cooldown */
        var onCooldown = await this.onCooldown(message.member, command);

        if (onCooldown) {
            this.catalyst.modules.errors.cooldown(message, command, await this.getCooldown(message.member, command));
            return;
        }

        /* execute command */
        this.runCommand(command, message, args).then(() => {
            /* update cooldown if command has one */
            this.saveCooldown(message.member, command);

        /* handle errors accordingly */
        }).catch(err => {
            this.catalyst.log("Commands", `Unable to execute ${command.name} command: ${err}`)
            this.catalyst.modules.errors.runFail(message, command);
        });
    }

    /**
     * sets up the commands
     */
    async setupCommands() {
        await this.catalyst.setupDirectory("./src/commands", this.commandsTree, [".js", ".mjs"]);

        /* create functions to handle nested tables recursively */
        function setupTable(table, handler) {
            for (const [name, command] of Object.entries(table)) {
                if (command.name) {
                    handler(command);
                } else {
                    setupTable(command, handler);
                }
            }
        }

        /* actually connect the listeners */
        return setupTable(this.commandsTree, (...params) => {
            return this.addCommand(...params);
        });
    }

    /**
     * module initialization process
     */
    async init() {
        await this.setupCommands();
        this.catalyst.log("Events", "Loaded");
    }

    constructor(catalyst) {
        this.catalyst = catalyst;
        this.commandsTree = {};
        this.cooldowns = {};
        this.commands = [];

        catalyst.commands = this.commands;
    }
};

module.exports = CommandsModule;