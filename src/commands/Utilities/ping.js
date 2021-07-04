const { MessageEmbed } = require('discord.js');
const Messages = require('../../utils/messages.js');
const { Command, CommandType } = require('../../modules/commands.js');

class PingCommand extends Command {
	constructor() {
		super({
			name: 'ping',
			type: CommandType.BOTH,
			description: 'Gets the bot\'s latency.',
			aliases: [ 'getPing', 'latency', 'getLatency' ]
		});
	}

	async run(bot, session, args) {
		session.respond('Pinging...').then(reply => {
			const wsPing = bot.client.ws.ping;
			if (session.isSlash) {
				return reply.edit(`:ping_pong: Pong! API Latency: ${wsPing} ms.`);
			}
			const deltaTime = reply.createdAt - session.message.createdAt;
			reply.edit(`:ping_pong: Pong! Took ${deltaTime} ms (API latency: ${wsPing} ms).`);
		});
	}
}

module.exports = PingCommand;
