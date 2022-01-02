// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { EventEmitter } from 'events';
import CatalystClient from 'core/client';

interface ModuleOptions {
  name: string;
  desc?: string;
  authors?: Array<string>;
  client: CatalystClient;
}

export default class Module extends EventEmitter {
  name: string;
  desc: string = 'No description';
  authors: Array<string> = [];
  client: CatalystClient;

  load(_modules: { [key: string]: any }): void {
    // TODO: Fix the typedef for the `modules` parameter.
    // Nothing to do here.
  }

  constructor(info: ModuleOptions) {
    super({ captureRejections: false });
    this.name = info.name;
    this.desc = info.desc ?? this.desc;
    this.client = info.client;
    this.authors = info.authors ?? this.authors;

    console.log(`${this.name} module loaded.`);
  }
}
