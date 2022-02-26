// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { ShardingManager } from 'kurasuta';
import { EventEmitter } from 'events';
import { createLogger, Logger } from 'utils/logger';

export default abstract class Service extends EventEmitter {
  logger: Logger;

  abstract run(manager: ShardingManager): Promise<void>;

  constructor(public name: string) {
    super();
    this.logger = createLogger({
      service: this.name
    });

    this.logger.info(`${this.name} service loaded.`);
  }
}
