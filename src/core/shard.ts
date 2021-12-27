// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import 'module-alias/register';
import config from 'core/config';
import CatalystClient from './client';

const { SHARD_LIFETIME, TOKEN } = config;

const client = new CatalystClient(TOKEN);
const updateStatus = () => {
  client.user?.setActivity(`${client.guilds.cache.size} servers`, { type: 'WATCHING' });
}

client.on('ready', async () => {
  updateStatus();
  setInterval(updateStatus, 5000);
})

process.on('message', async (message: any) => {
  if (message.type !== 'shardId') return;
  client.shardId = message.data.shardId;
});

if (SHARD_LIFETIME) {
  setTimeout(() => {
    process.exit();
  }, SHARD_LIFETIME * 1000);
}