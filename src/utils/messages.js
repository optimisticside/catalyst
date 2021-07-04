const { MessageEmbed } = require('discord.js');
const config = require('../data/config.json');

class Messages {
	static send(title, text) {
		const embed = new MessageEmbed()
			.setTitle(title)
			.setDescription(text)
			.setColor(config.defaultColor);
		return embed;
	}

	static failure(title, text) {
		const embed = new MessageEmbed()
			.setTitle(title)
			.setDescription(`:exclaimation: ${text}!`)
			.setColor(config.failureColor);
		return embed;
	}

	static warning(title, text) {
		const embed = new MessageEmbed()
			.setTitle(title)
			.setDescription(`:warning: ${text}!`)
			.setColor(config.warningColor);
		return embed;
	}

	static success(title, text) {
		const embed = new MessageEmbed()
			.setTitle(title)
			.setDescription(`:white_check_mark: ${text}.`)
			.setColor(config.successColor);
	
		return embed;
	}
}

module.exports = Messages;
