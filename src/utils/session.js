const { Message, APIMessage } = require('discord.js');

/**
 * A session allows communication to a discord
 * user.
 */
class Session {
	constructor(client, given) {
		const isSlash = !(given instanceof Message);
		if (isSlash) {
			this.interaction = given;
			this.guild = client.guilds.cache.get(given.guild_id);
			this.channel = this.guild && this.guild.channels.cache.get(given.channel_id);
			this.member = this.guild && this.guild.members.cache.get(given.member.user.id);
		} else {
			this.message = given;
			this.guild = given.guild;
			this.channel = given.channel;
			this.member = given.member;
		}
		this.isSlash = isSlash;
		this.client = client;
	}

	sendRaw(data) {
		const interaction = this.interaction;
		return this.client.api.interactions(this.interaction.id, this.interaction.token)
			.callback.post(data);
	}

	async formatObject(object) {
		const { data, files } = await APIMessage.create(
			this.client.channels.resolve(this.interaction.channel_id),
			object)
			.resolveData()
			.resolveFiles();
		return { ...data, files };
	}

	async respond(response) {
		if (!this.isSlash) {
			return this.message.channel.send(response);
		}
		var data = { content: response };
		if (typeof response === 'object') {
			data = await this.formatObject(response);
		}
		await this.sendRaw({ data: { type: 4, data } });
		return this.channel && this.channel.lastMessage;
	}
}

module.exports = Session;
