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
