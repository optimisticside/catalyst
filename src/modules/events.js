const Module = require('../structs/module.js');
const { promisify } = require('util');
const path = require('path');
const glob = require('glob');

module.exports = class Events extends Module {
  async on(name, run) {
    this.client.on(name, run);
  }

  async registerHandler(handler) {
    if (!handler.name || !handler.run) return;
    this.on(handler.name, handler.run);
  }

  load() {
    let files = glob.sync(path.join(__dirname, '/../events/*.js')
      .concat(glob.sync(path.join(__dirname, '/../events/**/*.js'))));
    files.map(file => {
      promisify(require)(file).then(this.registerHandler.bind(this));
    });
  }

  constructor(client) {
    super({
      name: 'eventHandler',
      client: client
    });
  }
};