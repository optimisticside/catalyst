// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { EventEmitter } from 'events';
import CatalystClient from 'core/client';
import { createLogger, Logger } from 'utils/logger';

interface ModuleOptions {
  name: string;
  desc?: string;
  authors?: Array<string>;
  client: CatalystClient;
}

export default abstract class Module extends EventEmitter {
  name: string;
  desc = 'No description';
  authors: Array<string> = [];
  client: CatalystClient;
  logger: Logger;

  abstract load(): void;

  constructor(info: ModuleOptions) {
    super();
    this.name = info.name;
    this.desc = info.desc ?? this.desc;
    this.client = info.client;
    this.authors = info.authors ?? this.authors;
    this.logger = createLogger({
      cluster: this.client.shard?.clusterCount,
      shard: this.client.shard?.id,
      module: this.name
    });

    this.logger.info(`${this.name} module loaded.`);
  }
}
