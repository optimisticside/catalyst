// Catalyst
// Copyright 2021 Catalyst contributors
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

    this.client.user?.setPresence({
      status: 'online',
      activities: [{ name: `${guilds} servers`, type: 'WATCHING' }],
      shardId: this.client.shard?.id,
    });
  }

  async launch() {
    this.client.cluster = this;
    await this.client.load()

    this.client.login(TOKEN);
    if (this.client.isReady()) {
      await new Promise(res => this.client.on('ready', res));
    }

    this.updateStatus();
    setInterval(this.updateStatus.bind(this), 5000);
  }
}
