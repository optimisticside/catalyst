// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import 'module-alias/register';
import config from 'core/config';
import { BaseCluster } from 'kurasuta';
import CatalystClient from './client';

const { TOKEN } = config;

export default class CatalystCluster extends BaseCluster {
  updateStatus() {
    this.client.user?.setActivity(`${this.client.guilds.cache.size} servers`, {
      type: 'WATCHING'
    });
  }

  launch() {
    const client = this.client as CatalystClient;
    client.on('ready', async () => {
      this.updateStatus();
      setInterval(this.updateStatus.bind(this), 5000);
    });

    client.cluster = this;
    client.load().then(() => client.login(TOKEN));
  }
}
