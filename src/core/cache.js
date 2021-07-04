const { ShardClientUtil } = require('discord.js');
const createEnum = require('../utils/enum.js');

const CacheAction = createEnum([ 'GET', 'SET', 'CLEAR', 'GET_REPLY', 'SET_REPLY', 'CLEAR_REPLY' ]);

/**
 * The GlobalCache stores and manages data that needs to be
 * shared between all shards.
 */
class GlobalCache {
	/**
	 * Creates an instance of GlobalCache.
	 * @param {Discord.ShardingManager} sharingManager The sharding manager.
	 */
	constructor(shardingManager) {
		this.shardingManager = shardingManager;
		this.collections = {};

		shardingManager.on('shardCreate', this.handleShard.bind(this));
		shardingManager.shards.forEach(this.handleShard.bind(this));
	}

	/**
	 * Sets up a shard and listens for messages.
	 * @param {Discord.Shard} shard The shard to set up.
	 */
	handleShard(shard) {
		shard.on('message', message => this.onMessage(shard, message));
	}

	/**
	 * Called upon message from client shard.
	 * @param {Shard} shard The shard that sent the message.
	 * @param {Object} message The message sent by the shard.
	 */
	onMessage(shard, message) {
		switch (message.action) {
			case CacheAction.SET:
				this.get(shard, message);
				break;
			case CacheAction.SET:
				this.set(shard, message);
				break;
			case CacheAction.REMOVE:
				this.remove(shard, message);
				break;
		}
	}

	/**
	 * Handles a retrieval request from a shard.
	 * @param {Discord.Shard} shard The shard that sent the message.
	 * @param {Object} message The message contining the request.
	 */
	get(shard, message) {
		const collection = this.getCollection(message.collection);
		const data = collection && collection[message.key];
		shard.send({
			action: CacheAction.GET_REPLY,
			id: message.id,
			collection: message.collection,
			key: message.key,
			data: typeof data == 'undefined' ? null : data,
		});
	}

	/**
	 * Handles a setting request from a shard.
	 * @param {Discord.Shard} shard the Shard that sent the request.
	 * @param {Object} message The message contining the request.
	 */
	set(shard, message) {
		const collection = this.getCollection(message.collection);
		const oldData = collection[message.key];
		
		collection[message.key] = message.data;
		shard.send({
			action: CacheAction.SET_REPLY,
			id: message.id,
			collection: message.collection,
			key: message.key,
			data: typeof oldData == 'undefined' ? null : oldData,
		});
	}
}

/**
 * A Cache is a shard's interface to the global cache.
 */
class Cache {
	/**
	 * Creates an instance of Cache.
	 * @param {Discord.Client} client The discord client the cache belongs to.
	 */
	constructor(client) {
		this.client = client;
		this.shardClientUtil = ShardClientUtil.singleton(client);

		process.on('message', this.onMessage);
	}

	/**
	 * Called upon IPC message.
	 * @param {Object} message The message sent to this process.
	 */
	onMessage(message) {
		this.promises[message.id](message.data);
	}

	/**
	 * Gets a value from the global cache.
	 * @param {string} collection The collection the data is stored in.
	 * @param {string} key The key in the collection of the data.
	 * @returns {Promise<any>} The data stored at the key.
	 */
	get(collection, key) {
		const id = this.index++;
		this.shardClientUtil.send({
			action: CacheAction.GET,
			collection: collection,
			key: key,
			id: id
		});
		return new Promise(resolve => this.promises[id] = resolve);
	}

	/**
	 * Sets a value in the global cache.
	 * @param {string} collection The collection the data is stored in.
	 * @param {string} key The key in the collection of the data.
	 * @param {any} data The data to set the key to.
	 * @returns {Promise<any>} The data before the update.
	 */
	set(collection, key, data) {
		const id = this.index++;
		this.shardClientUtil.send({
			action: CacheAction.SET,
			id: id,
			collection: collection,
			key: key,
			data: data,
		});
		return new Promise(resolve => this.promises[id] = resolve);
	}
}

module.exports = { CacheAction, GlobalCache, Cache };
