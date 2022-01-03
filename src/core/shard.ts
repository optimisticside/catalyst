// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import 'module-alias/register';
import config from 'core/config';
import { BaseCluster } from 'kurasuta';
import CatalystClient from './client';

const { TOKEN } = config;

export default class CatalystCluster extends BaseCluster {
  launch() {
    const client = new CatalystClient(TOKEN);
    const updateStatus = () => {
      client.user?.setActivity(`${client.guilds.cache.size} servers`, {
        type: 'WATCHING'
      });
    };
  
    client.on('ready', async () => {
      updateStatus();
      setInterval(updateStatus, 5000);
    });
  
    process.on('message', async (message: any) => {
      if (message.type !== 'shardId') return;
      client.shardId = message.data.shardId;
    });
  }
}