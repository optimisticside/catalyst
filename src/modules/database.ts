// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import Module from 'structs/module';
import mongoose from 'mongoose';
import config from 'core/config';
import CatalystClient from 'core/client';

const { MONGODB_SRV } = config;

export default class Database extends Module {
  connected = false;

  load() {
    mongoose
      .connect(MONGODB_SRV)
      .then(() => {
        console.log('Connected to Mongo DB');
        this.connected = true;
        this.emit('connect');
      })
      .catch(err => {
        console.error(`Unable to connect to Mongo DB: ${err}`);
      });
  }

  constructor(client: CatalystClient) {
    super({
      name: 'database',
      client: client
    });

    this.connected = false;
  }
}
