// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import 'module-alias/register';
import config from 'core/config';
import { BaseCluster } from 'kurasuta';
import CatalystClient from './client';

const { TOKEN } = config;

export default class CatalystCluster extends BaseCluster {
  declare client: CatalystClient;

  async updateStatus() {
    const guildCounts = (await this.client.shard?.fetchClientValues('guilds.cache.size')) as Array<number>;
    const guilds = guildCounts.reduce((acc, count) => acc + count, 0);

    // Do not change this to setPresence without changing the interval
    // for the update. Presences can only be updated once every 20 seconds,
    // while activities can be changed every 4 seconds.
    this.client.user?.setActivity({ name: `${guilds} servers`, type: 'WATCHING' });
  }

  async launch() {
    this.client.cluster = this;
    await this.client.load();

    this.client.login(TOKEN);
    this.client.on('rateLimit', data => {
      this.client.logger.warn(`Rate limited for ${data.timeout} ms at ${data.method} ${data.route}`);
    });

    await this.client.waitForReady();
    this.updateStatus();
    setInterval(this.updateStatus.bind(this), 20000);
  }
}
