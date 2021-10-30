// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Redis = require('ioredis');
const Module = require('../structs/module.js');
const { REDIS_HOST, REDIS_PORT, KEY_DELIM } = require('../config.json');

// We will implement caching later, so for now
// these are 'nothing' functions.
module.exports = class Database extends Module {
  async getRaw(key) {
    return await this.redis.get(key);
  }

  async setRaw(key, value) {
    return await this.redis.set(key, value);
  }

  async get(...given) {
    const key = [ ...given ];
    return await this.redis.get(key.join(KEY_DELIM));
  }

  async set(...given) {
    const key = [ ...given ];
    const value = key.pop();
    return await this.redis.set(key.join(KEY_DELIM), value);
  }

  async getGuild(...given) {
    return await this.get('guild', ...given);
  }

  async setGuild(...given) {
    return await this.set('guild', ...given);
  }

  constructor(client) {
    super({
      name: 'database',
      client: client
    });
    
    this.guilds = {};
    this.redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
    client.redis = this.redis;
  }
}