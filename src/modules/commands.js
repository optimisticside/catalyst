const Messages = require('../utils/messages.js');
const Session = require('../utils/session.js');
const createEnum = require('../utils/enum.js');
const loadDir = require('../utils/loaddir.js');
const config = require('../data/config.json');

const CommandType = createEnum([ 'REGULAR', 'SLASH', 'BOTH' ]);

/**
 * The command super-class contains information part
 * of every commmand.
 */
class Command {
	constructor(options) {
		this.name = options.name;
		this.description = options.description;
		this.aliases = options.aliases || [];
		this.guildOnly = options.guildOnly || false;
		this.type = options.type || CommandType.REGULAR;
		this.args = options.args || [];
	}

	async run(bot, message, args) {
		console.error(`Function for ${this.name} command not provided`);
	}
}


/**
 * The command manager loads and maintains all commands,
 * and handles users' messages.
 */
class CommandManager {
	static Command = Command;
	static CommandType = CommandType;

	static load(manager) {
		return new CommandManager(manager);
	}

	/**
	 * Creates an instance of CommandManager.
	 * @param {Manager} manager The module-manager loading the module.
	 */
	constructor(manager) {
		this._manager = manager;
		this.bot = manager && manager.bot;
		this.modules = manager && manager.modules;
		this.commands = [];
		this.commandTree = {};

		loadDir('../commands', this.commandTree, true).then(() => this.setupCommands());
		this.bot.client.on('message', this.onMessage.bind(this));
	}

	/**
	 * Finds a command based on the provided string.
	 * @param {string} call The string that refers to the command.
	 * @returns {Command?} The found command.
	 */
	findCommand(call) {
		for (var i = 0; i < this.commands.length; i++) {
			var command = this.commands[i];
			if (!command) continue;
			if (command.name && command.name.toLowerCase() == call) {
				return command;
			}
			for (var aliase of command.aliases || []) {
				if (aliase.toLowerCase() == call) {
					return command;
				}
			}
		}
	}

	/**
	 * Validates a guild-member's permissions.
	 * @param {Discord.GuildMember} member The guild member to check the permissiosn of.
	 * @param {Array<string>} perms The permissions to validate.
	 * @returns {boolean} Whether the member meets the permission requirements.
	 */
	checkPerms(member, perms) {
		for (var perm of perms || []) {
			if (perm && !member.hasPermission(perm)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Executes a command's execution function with
	 * the provided parameters.
	 * @param {Command} command The command to run.
	 * @param {tuple<any>} params The parameters to provide to the command.
	 * @returns {Promise<any>} The execution result.
	 */
	executeCommand(command, ...params) {
		return command.run(this.bot, ...params);
	}

	/**
	 * Called upon sent message.
	 * @param {Discord.Message} message The message sent.
	 */
	onMessage(message) {
		if (message.author.bot) return;
		var content = message.content.trim();
		const session = new Session(this.bot.client, message);

		// Determine if the command is valid by checking
		// for the prefix.
		const clientId = this.bot.client.user.id;
		const prefixes = [ `<@${clientId}>`, `<@!${clientId}>`, config.prefix ];
		var prefix = null;
		prefixes.map(p => {
			if (content.startsWith(p)) {
				content = content.slice(p.length);
				prefix = p;
			}
		});
		if (!prefix || content == prefix) return;

		// Parse the message and retrive the commmand
		// and the arguments to provide.
		const args = content.trim().split(config.splitKey);
		const call = args.shift().toLowerCase();
		const command = this.findCommand(call);
		if (!command) {
			const response = Messages.warning('Command Handler',
				`${call} is not a valid command`);
			return session.respond(response);
		}

		// If the command can only be run in a guild,
		// then make sure that requirement is met.
		if (command.guildOnly && !message.guild) return;
	
		// Leave the rest to the handleCommand procedure.
		return this.handleCommand(command, session, args);
	}

	/**
	 * Handles a command's execution. Stores code
	 * shared by all types of commands.
	 * @param {Command} command The command to execute.
	 * @param {Session} session The execution session.
	 * @param {Object} args The dictionary containing the formatted args.
	 * @returns {Promise<any>} The execution result.
	 */
	handleCommand(command, session, args) {
		// Ensure both the bot and the user have the
		// permissions required by the command.
		const perms = command.perms || [];
		const userHasPerms = this.checkPerms(session.member, perms);
		const botHasPerms = this.checkPerms(session.guild.me, perms);
		if (!userHasPerms) {
			const response = Messages.warning('Command Handler',
				`You do not have permissions to run the ${call} command`);
			return message.channel.send(response);
		}
		if (!botHasPerms) {
			const response = Messages.warning('Command Handler',
				`I do not have permissions to run the ${call} command`);
			return message.channel.send(response);
		}

		// Finally, execute the command.
		return this.executeCommand(command, session, args).catch(err => {
			console.log(`Unable to run ${command.name}: ${err}`);
			const response = Messages.warning('Command Handler',
				`Unable to run ${call} command`);
			return message.channel.send(response);
		});
	}

	/**
	 * Sets up the commands into an array and handles
	 * any command categories (and an indefinite amount of
	 * sub-categories).
	 */
	setupCommands() {
		const initSection = (object) => {
			var entries = {};
			for (var [name, entry] of Object.entries(object)) {
				if (entry instanceof Function) {
					entries[name] = new entry();
				} else if (entry instanceof Object) {
					entries[name] = initSection(entry);
				}
			}
			return entries;
		}

		const loadSection = (object, section) => {
			for (var [name, entry] of Object.entries(object)) {
				const subSection = (entry.category ? (entry.category + ':') : '') + name;
				if (entry instanceof Command) {
					entry.category = section;
					this.commands.push(entry);
				} else if (entry instanceof Object) {
					loadSection(entry, subSection);
				}
			}
		}

		this.commandTree = initSection(this.commandTree);
		loadSection(this.commandTree);
	}
}

module.exports = CommandManager;
