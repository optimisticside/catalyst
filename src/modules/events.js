// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Module = require('../structs/module.js');
const path = require('path');
const glob = require('glob');
const requireAsync = async f => require(f);

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
    files.map(async file => {
      const handler = requireAsync(file);
      this.registerHandler(handler);
    });
  }

  constructor(client) {
    super({
      name: 'eventHandler',
      client: client
    });
  }
};