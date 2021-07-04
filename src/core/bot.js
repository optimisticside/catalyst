const { Client } = require('discord.js');
const { Cache } = require('../core/cache.js');
const config = require('../data/config.json');

class DiscordBot {
	constructor() {
		this.client = new Client();
		this.servers = {};
		this.owners = {};
	}

	login(token) {
		this.client.login(token || config.token);
	}
}

module.exports = DiscordBot;
