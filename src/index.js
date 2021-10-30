// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { TOKEN, TOTAL_SHARDS, LIFETIME } = require('./config.json');
const { ShardingManager } = require('discord.js');
const path = require('path');

const shardingManager = new ShardingManager(path.join(__dirname, 'core/shard.js'), {
  token: TOKEN,
  totalShards: TOTAL_SHARDS || 'auto'
});

shardingManager.on('shardCreate', async shard => {
  console.log(`Shard ${shard.id} launched`);
});
shardingManager.spawn(TOTAL_SHARDS || 'auto', 8000, -1);

if (LIFETIME) {
  setTimeout(() => {
    shardingManager.respawn = false;
    shardingManager.broadcastEval('process.exit()');
  }, LIFETIME * 1000);
}