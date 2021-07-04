const fs = require('fs');
const loadDir = require('../utils/loaddir.js');
const executeFile = require('../utils/exec.js');


/**
 * The event manager manages client events
 * and links files in the 'events' directory
 * to the appropriate event.
 */
class EventManager {
	static load(manager) {
		return new EventManager(manager);
	}

	constructor(manager) {
		this._manager = manager;
		this.bot = manager && manager.bot;
		this.modules = manager && manager.modules;
		this.handlers = {};

		loadDir('../events', this.handlers, true).then(() => this.setupEvents());
	}

	/**
	 * Binds a handler to a client event.
	 * @param {string} name The name of the event.
	 * @param {Function} handler The handler to bind.
	 */
	bindHandler(name, handler) {
		this.bot.client.on(name, handler);
	}

	/**
	 * Sets up events in the 'events' directory and
	 * binds them to their appropriate event.
	 */
	setupEvents() {
		for (var [name, handler] of Object.entries(this.handlers)) {
			if (typeof handler == 'function') {
				this.bindHandler(name, handler);
			} else {
				for (var [_, subHandler] of Object.entries(handler)) {
					this.bindHandler(name, handler);
				}
			}
		}
	}
}

module.exports = EventManager;
