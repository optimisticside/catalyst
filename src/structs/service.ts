// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { ShardingManager } from 'kurasuta';
import { EventEmitter } from 'events';

export default class Service extends EventEmitter {
  async run(manager: ShardingManager): Promise<void> {
    console.log(manager);
    throw new Error('No run method implemented');
  }

  constructor(public name: string) {
    super({ captureRejections: false });
    console.log(`${this.name} service loaded.`);
  }
}
