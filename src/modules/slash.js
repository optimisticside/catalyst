const { CommandType } = require('../modules/commands.js');
const Messages = require('../utils/messages.js');
const Session = require('../utils/session.js');
const createEnum = require('../utils/enum.js');
const config = require('../data/config.json');

const OptionType = createEnum([
	'SUB_COMMAND',
	'SUB_COMMAND_GROUP',
	'STRING',
	'INTEGER',
	'BOOLEAN',
	'USER',
	'CHALLENGE',
	'ROLE',
	'MENTIONABLE'
]);

/**
 * The slash handler manages slash commands.
 */
class SlashHandler {
	static OptionType = OptionType;

	static load(manager) {
		return new SlashHandler(manager);
	}

	constructor(manager) {
		this._manager = manager;
		this.bot = manager && manager.bot;
		this.modules = manager && manager.modules;
		this.client = this.bot && this.bot.client;

		this.client.on('guildCreate', this.addGuild.bind(this));
		this.client.on('ready', () => {
			const ws = this.client.ws;
			ws.on('INTERACTION_CREATE', this.onInteraction.bind(this));
			this.client.guilds.cache.map(this.addGuild.bind(this));
		});
	}

	getOptionData(arg) {
		const data = {
			type: typeof arg.type === 'undefined' ? null : arg.type,
			name: typeof arg.name === 'undefined' ? null : arg.type,
			description: typeof arg.description === 'undefined' ? null : arg.description,
			required: typeof arg.required === 'undefined' ? null : arg.required
		};
		return data;
	}

	getCommandData(command) {
		const data = {
			name: typeof command.name === 'undefined' ? null : command.name,
			description: typeof command.description === 'undefined' ? null : command.description,
			options: []
		};
		for (var arg of command.args || []) {
			data.options.push(this.getOptionData(arg));
		}
		return data;
	}

	addGuild(guild) {
		const app = this.getApp(guild.id);
		this.clearCommands(guild);
		for (var command of this.modules.commands.commands) {
			const data = { data: this.getCommandData(command) };
			app.commands.post(data);
		}
	}

	clearCommands(guild) {
		const app = this.getApp(guild.id);
		app.commands.get().then(commands => {
			commands.map(command => {
				app.commands(command.id).delete();
			});
		});
	}

	getApp(guildId) {
		const app = this.client.api.applications(this.client.user.id);
		if (guildId) {
			app.guilds(guildId);
		}
		return app;
	}

	/**
	 * Called upon opened interaction with user.
	 * This happens when they enter a slash command.
	 * @param {object} interaction The raw interaction object sent through the web-socket.
	 */
	onInteraction(interaction) {
		const data = interaction.data;
		const call = data.name.toLowerCase();
		const options = data.options || [];
		const session = new Session(this.bot.client, interaction);

		// Search for the command. If it does not exist,
		// throw error.
		const command = this.modules.commands.findCommand(call);
		if (!command) {
			const response = Messages.warning(
				'Command Handler', `${call} is not a valid command`);
			return session.respond(response);
		}

		// Ensure command is a valid slash command.
		if (command.type == CommandType.REGULAR) {
			const response = Messages.warning('Command Handler',
				`${call} is not a slash command`);
			return session.respond(response);
		}

		// Parse arguments and leave
		// the rest to the command handler.
		const args = {};
		for (var option of options) {
			args[option.name] = option.value;
		}
		this.modules.commands.handleCommand(command, session, args);
	}
}

module.exports = SlashHandler;
