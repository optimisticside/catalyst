// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { TOKEN, TOTAL_SHARDS, LIFETIME } = require('./util/configParser.js');
const { ShardingManager } = require('discord.js');
const requirePromise = async f => require(f);
const glob = require('glob');
const path = require('path');

const shardingManager = new ShardingManager(path.join(__dirname, 'core/shard.js'), {
  token: TOKEN,
  totalShards: TOTAL_SHARDS || 'auto'
});

shardingManager.on('shardCreate', async shard => {
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
    shardingManager.broadcastEval('process.exit()');
  }, LIFETIME * 1000);
}

const serviceFiles = glob.sync(path.join(__dirname, 'services/**/*.js'));
(async () => {
  await Promise.all(serviceFiles.map(async file => {
    const fileName = path.basename(file, path.extname(file));
    const result = await requirePromise(file).catch(err => {
      console.error(`Unable to load ${fileName} service: ${err}`);
    });

    if (!result || !result instanceof Function) return;
    await result(shardingManager).catch(err => {
      console.error(`Unable to start ${fileName} service: ${err}`);
    });
  }));
})();