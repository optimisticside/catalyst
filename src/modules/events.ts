// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import Module from 'structs/module';
import { resolveFile } from 'utils/file';
import * as path from 'path';
import * as glob from 'glob';
import CatalystClient from 'core/client';

export type EventCallback = (...args: any[]) => void | Promise<void>;
export interface EventHandler {
  name: string;
  run: EventCallback;
};

export default class Events extends Module {
  on(name: string, run: EventCallback) {
    this.client.on(name, run);
    return this;
  }

  async registerHandler(handler: EventHandler) {
    if (!handler.name || !handler.run) return;
    this.on(handler.name, handler.run);
  }

  load() {
    let files = glob.sync(path.join(__dirname, '../events/**/*.js'));
    files.map(async (file: string) => {
      const handler = await resolveFile<EventHandler>(file);
      if (!handler) return;
      this.registerHandler(handler);
    });
  }

  constructor(client: CatalystClient) {
    super({
      name: 'eventHandler',
      client: client
    });
  }
};