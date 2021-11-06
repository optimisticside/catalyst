// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { TOKEN, TOTAL_SHARDS, LIFETIME } = require('./config.json');
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
shardingManager.spawn(TOTAL_SHARDS || 'auto', 8000, -1);

if (LIFETIME) {
  setTimeout(() => {
    shardingManager.respawn = false;
    shardingManager.broadcastEval('process.exit()');
  }, LIFETIME * 1000);
}

const serviceFiles = glob.sync(path.join(__dirname, 'services/**/*.js'));
(async () => {
  serviceFiles.map(async file => {
    const result = await requirePromise(file).catch(err => {
      const fileName = path.basename(file, path.extname(file));
      console.error(`Unable to load ${fileName} service: ${err}`);
    });

    if (!result || !result instanceof Function) return;
    await result(shardingManager);
  });
})();