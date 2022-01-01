// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import 'module-alias/register';
import config from 'core/config';
import { ShardingManager, Shard } from 'discord.js';
import glob from 'glob-promise';
import * as path from 'path';
import { resolveFile } from 'utils/file';

type Service = (shardingManager: ShardingManager) => Promise<void>;
const { TOTAL_SHARDS, TOKEN, LIFETIME } = config;

const shardingManager = new ShardingManager(path.join(__dirname, 'core/shard.js'), {
  token: TOKEN,
  totalShards: TOTAL_SHARDS || 'auto'
});

shardingManager.on('shardCreate', async (shard: Shard) => {
  console.log(`Shard ${shard.id} launched`);
  shard.on('ready', async () => {
    console.log(`Shard ${shard.id} connected to Discord `);
    shard.send({ type: 'shardId', data: { shardId: shard.id } });
  });
});

shardingManager.spawn({
  amount: TOTAL_SHARDS || 'auto',
  delay: 8000
});

if (LIFETIME) {
  setTimeout(() => {
    shardingManager.respawn = false;
    shardingManager.broadcastEval(() => process.exit(0));
  }, LIFETIME * 1000);
}

(async () => {
  const serviceFiles = await glob(path.join(__dirname, 'services/**/*.js'));
  await Promise.all(serviceFiles.map(async file => {
    const fileName = path.basename(file, path.extname(file));
    const result = await resolveFile<Service>(file).catch(err => {
      console.error(`Unable to load ${fileName} service: ${err}`);
    });

    if (!result || !(result instanceof Function)) return;
    await result(shardingManager).catch(err => {
      console.error(`Unable to start ${fileName} service: ${err}`);
    });
  }));
})();