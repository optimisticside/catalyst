const path = require('path');
const DiscordBot = require('../core/bot.js');
const Manager = require('../core/manager.js');
const config = require('../data/config.json');

// Instantiate the discord bot.
const discordBot = new DiscordBot();

// Listen for any messages from other
// processes, and hand them over to the
// bot accordingly.
process.on('message', msg => {
	switch (msg.action) {
	
	}
});

// Load module manager.
global.manager = new Manager(discordBot);
global.manager.loadDir(path.join(__dirname, '../modules'));

discordBot.client.on('ready', () => {
	console.log('Ready.');
});

// Finally, log in the discord bot.
discordBot.login(config.token);

// Exit process after life time
// expiration if provided.
if (config.shardLifeTime) {
	setTimeout(() => {
		process.exit();
	}, config.shardLifeTime * 1000);
}
