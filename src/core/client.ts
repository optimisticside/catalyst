// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { Client, Intents } from 'discord.js';
import Module from 'structs/module';
import * as glob from 'glob';
import * as path from 'path';

const { REST_TIME_OFFSET } = config;

export default class CatalystClient extends Client {
  modules: {[key: string]: Module} = {};
  shardId?: number;

  async loadModule(file: string) {
    const requireAsync = async (f: string) => import(f);
    const module = await requireAsync(file)
      .catch((err: Error) => {
        const fileName = path.basename(file, path.extname(file));
        console.error(`Unable to load ${fileName} module: ${err}`);
      });
    const object = new module(this);
    this.modules[object.name] = object;
  }

  async initModule(module: Module) {
    if (!module.load) return;
    module.load(this.modules);
  }

  constructor(token: string) {
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

      await this.login(token);
      console.log('Ready');
    })();
  }
};