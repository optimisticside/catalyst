// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Module = require('../structs/module.js');
const mongoose = require('mongoose');
const { MONGODB_SRV } = require('../util/configParser.js');

module.exports = class Database extends Module {
  load() {
    mongoose.connect(MONGODB_SRV, {
      useNewUrlParser: false,
      useUnifiedTopology: true
    }).then(() => {
      console.log('Connected to Mongo DB');
      this.connected = true;
      this.emit('connect');
    }).catch(err => {
      console.error(`Unable to connect to Mongo DB: ${err}`);
    });
  }

  constructor(client) {
    super({
      name: 'database',
      client: client
    });

    this.connected = false;
  }
}