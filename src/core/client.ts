// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { Client, ClientOptions } from 'discord.js';
import Module from 'structs/module';
import glob from 'glob-promise';
import * as path from 'path';
import { resolveFile } from 'utils/file';
import CatalystCluster from 'core/cluster';

export default class CatalystClient<Ready extends boolean = boolean> extends Client<Ready> {
  modules: { [key: string]: Module } = {};
  cluster?: CatalystCluster;

  async loadModule(file: string) {
    const module = await resolveFile<Module>(file, this).catch((err: Error) => {
      const fileName = path.basename(file, path.extname(file));
      console.error(`Unable to load ${fileName} module: ${err}`);
    });
    if (!module) return;
    this.modules[module.name] = module;
  }

  initModule(module: Module) {
    if (!module.load) return;
    module.load(this.modules);
  }

  async load() {
    const moduleFiles = await glob(path.join(__dirname + '/../modules/**/*.js'));
    await Promise.all(moduleFiles.map(this.loadModule.bind(this)));
    const moduleArray = Object.entries(this.modules).map(([, module]) => module);
    moduleArray.map(this.initModule.bind(this));
  }

  constructor(options: ClientOptions) {
    super(options);
  }
}
