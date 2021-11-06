// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { DBL_TOKEN, CLIENT_ID, STATS_UPDATE_INTERVAL } = require('../config.json');
const API_URL = `https://discordbotlist.com/api/v1/bots/${CLIENT_ID}/stats`;
const got = require('got');

module.exports = async (shardingManager) => {
  if (!DBL_TOKEN) return;

  const updateStats = async () => {
    const result = await Promise.all([
      shardingManager.fetchClientValues('guilds.cache.size'),
      shardingManager.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
    ]);
    const guilds = result[0].reduce((acc, count) => acc + count, 0);
    const users = result[1].reduce((acc, count) => acc + count, 0);

    return await got.post(API_URL, {
      headers: { Authorization: DBL_TOKEN },
      json: { users, guilds }
    }).catch(err => {
      console.error(`Unable to post stats to DBL: ${err}`);
    });
  };

  setInterval(updateStats, STATS_UPDATE_INTERVAL);
}