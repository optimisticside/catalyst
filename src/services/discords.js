// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { DISCORDS_TOKEN, CLIENT_ID, STATS_UPDATE_INTERVAL } = require('../config.json');
const API_URL = `https://discords.com/bots/api/bot/${CLIENT_ID}`;
const got = require('got');

module.exports = async (shardingManager) => {
  if (!DISCORDS_TOKEN) return;

  const updateStats = async () => {
    const guildCounts = await shardingManager.fetchClientValues('guilds.cache.size');
    const guilds = guildCounts.reduce((acc, count) => acc + count, 0);
   
    return await got.post(API_URL, {
      headers: { Authorization: DISCORDS_TOKEN },
      json: { server_count: guilds }
    }).then(() => {
      console.log('Posted stats to Discords');
    }).catch(err => {
      console.error(`Unable to post stats to Discords: ${err}`);
    });
  };

  setInterval(updateStats, STATS_UPDATE_INTERVAL);
}