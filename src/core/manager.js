const path = require('path');
const fs = require('fs');
const executeFile = require('../utils/exec.js');

/**
 * A manager manages a shard's modules and
 * loads them all.
 */
class Manager {
	/**
	 * Creates a new Manager.
	 * @param {DiscordBot} bot The discord bot for the current shard.
	 */
	constructor(bot) {
		this.bot = bot;
		this.modules = {};
	}

	/**
	 * Loads a single module.
	 * @param {string} filePath The path to the module's file.
	 */
	loadModule(name, filePath) {
		executeFile(filePath).then(module => {
			if (module && module.load) {
				this.modules[name] = module.load(this);
			}
		});
	}

	/**
	 * Loads all the modules in a dirctory.
	 * @param {string} path The path to the directory.
	 */
	loadDir(dirPath) {
		const files = fs.readdirSync(dirPath);
		files.map(file => {
			const fileType = path.extname(file);
			const fileName = path.basename(file, fileType);
			const filePath = path.join(dirPath, file);

			if ([ '.js', '.mjs' ].indexOf(fileType) != -1) {
				this.loadModule(fileName, filePath);
			}
		});
	}
}

module.exports = Manager;
