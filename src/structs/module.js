// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const EventEmitter = require('events');

module.exports = class Module extends EventEmitter {
  constructor(info) {
    super({ captureRejections: false });
    this.name = info.name;
    this.desc = info.desc || 'No description';
    this.type = info.type || 'default';
    this.client = info.client;
    this.authors = info.authors || [];

    console.log(`${this.name} module loaded.`);
  }
};