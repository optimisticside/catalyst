const { Message, APIMessage } = require('discord.js');

/**
 * A session allows communication to a discord
 * user.
 */
class Session {
	/**
	 * Creates a Session.
	 * @param {Discord.Client} client The client having this intearction.
	 * @param {Discord.Message|Interaction} given The given data.
	 */
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

	/**
	 * Sends raw data through the interaction.
	 * @param {any} data The data to send.
	 */
	sendRaw(data) {
		const interaction = this.interaction;
		return this.client.api.interactions(this.interaction.id, this.interaction.token)
			.callback.post(data);
	}

	/**
	 * Formats any object (embed, attachment, etc).
	 * @param {Object} object The object to format.
	 * @returns {Object} the foramtted object.
	 */
	async formatObject(object) {
		const { data, files } = await APIMessage.create(
			this.client.channels.resolve(this.interaction.channel_id),
			object)
			.resolveData()
			.resolveFiles();
		return { ...data, files };
	}

	/**
	 * Replies to the user through the interaction.
	 * @param {any} response The data to reply with.
	 * @returns {Discord.Message} The reply message.
	 */
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

	/**
	 * Replies to the user ephemerally.
	 * Only the user will be able to see the reply.
	 * @param {any} response The data to reply with.
	 */
	async respondEp(response) {
		if (!this.isSlash) {
			return this.message.channel.send(response);
		}
		var data = { content: response };
		if (typeof response === 'object') {
			data = await this.formatObject(response);
		}
		data.ephemeral = true;
		return await this.sendRaw({ data: { type: 4, data } });
	}
}

module.exports = Session;
