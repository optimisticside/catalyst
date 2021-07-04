const path = require('path');
const { ShardingManager } = require('discord.js');
const { GlobalCache } = require('./core/cache.js');
const config = require('./data/config.json');

// Set up sharding manager to handle shards: grouped
// processes to separate guild-handling.
const shardingManager = new ShardingManager(path.join(__dirname, 'core/shard.js'), {
	token: config.token,
	totalShards: config.totalShards || 'auto',
});

shardingManager.on('shardCreate', shard => {
	console.log(`Shard ${shard.id} launched`);
});
shardingManager.spawn(config.totalShards || 'auto', 8000, -1);

// Set up global cache to allow
// shards to share information.
global.globalCache = new GlobalCache(shardingManager);

// If we have a maximum life-time, then
// set timeout and stop sharing manager.
if (config.lifeTime) {
	setTimeout(() => {
		shardingManager.respawn = false;
		shardingManager.broadcastEval('process.exit()');
	}, config.lifeTime * 1000);
}
