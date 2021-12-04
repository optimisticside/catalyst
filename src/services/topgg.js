// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { TOPGG_TOKEN, CLIENT_ID, STATS_UPDATE_INTERVAL } = require('../util/configParser.js');
const API_URL = `https://top.gg/api/bots/${CLIENT_ID}/stats`;
const got = require('got');

module.exports = async (shardingManager) => {
  if (!TOPGG_TOKEN) return;

  const updateStats = async () => {
    const guildCounts = await shardingManager.fetchClientValues('guilds.cache.size');
    const guilds = guildCounts.reduce((acc, count) => acc + count, 0);
    const shards = shardingManager.shards.size;

    return await got.post(API_URL, {
      headers: { Authorization: TOPGG_TOKEN },
      json: { server_count: guilds, shard_count: shards }
    }).catch(err => {
      console.error(`Unable to post stats to Top.gg: ${err}`);
    });
  };

  setInterval(updateStats, STATS_UPDATE_INTERVAL);
}