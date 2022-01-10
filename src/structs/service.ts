// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { ShardingManager } from 'kurasuta';
import { EventEmitter } from 'events';
import { createLogger, Logger } from 'utils/logger';

export default class Service extends EventEmitter {
  logger: Logger;

  async run(_manager: ShardingManager): Promise<void> {
    throw new Error('No run method implemented');
  }

  constructor(public name: string) {
    super({ captureRejections: false });
    this.logger = createLogger({
      service: this.name
    });

    this.logger.info(`${this.name} service loaded.`);
  }
}
