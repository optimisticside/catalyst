// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import 'module-alias/register';
import config from 'core/config';
import { Client, Intents } from 'discord.js';
import { resolveFile } from 'utils/file';
import Module from 'structs/module';
import * as glob from 'glob';
import * as path from 'path';

const { TOKEN, REST_TIME_OFFSET, SHARD_LIFETIME } = config;

class CatalystClient extends Client {
  modules: {[key: string]: Module} = {};
  shardId?: number;

  updateStatus() {
    this.user?.setActivity(`${this.guilds.cache.size} servers`, { type: 'WATCHING' });
  }

  async loadModule(file: string) {
    const module = await resolveFile<Module>(file, this)
      .catch(err => {
        const fileName = path.basename(file, path.extname(file));
        console.error(`Unable to load ${fileName} module: ${err}`);
      });
    if (!module) return;
    this.modules[module.name] = module;
  }

  async initModule(module: Module) {
    if (!module.load) return;
    module.load(this.modules);
  }

  constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_MEMBERS
      ],
      partials: [ 'GUILD_MEMBER', 'REACTION' ],
      restTimeOffset: REST_TIME_OFFSET ?? 500
    });

    (async () => {
      let moduleFiles = glob.sync(path.join(__dirname + '/../../dist/modules/**/*.js'));
      await Promise.all(moduleFiles.map(this.loadModule.bind(this)));
      const moduleArray = Object.entries(this.modules).map(([ _, module ]) => module);
      await Promise.all(moduleArray.map(this.initModule.bind(this)));

      await this.login(TOKEN);
      console.log('Ready');

      this.updateStatus();
      setInterval(this.updateStatus.bind(this), 5000);
    })();
  }
};

const client = new CatalystClient();
process.on('message', async (message: any) => {
  if (message.type !== 'shardId') return;
  client.shardId = message.data.shardId;
});

if (SHARD_LIFETIME) {
  setTimeout(() => {
    process.exit();
  }, SHARD_LIFETIME * 1000);
}