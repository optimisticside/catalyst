// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { STATCORD_TOKEN, CLIENT_ID, STATS_UPDATE_INTERVAL } = require('../util/configParser.js');
const API_URL = 'https://api.statcord.com/v3/stats';
const got = require('got');

module.exports = async (shardingManager) => {
  if (!STATCORD_TOKEN) return;

  const updateStats = async () => {
    const result = await Promise.all([
      shardingManager.fetchClientValues('guilds.cache.size'),
      shardingManager.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
    ]);
    const servers = result[0].reduce((acc, count) => acc + count, 0);
    const users = result[1].reduce((acc, count) => acc + count, 0);
   
    return await got.post(API_URL, {
      json: {
        id: CLIENT_ID,
        key: STATCORD_TOKEN,
        servers,
        users,
        active: [],
        commands: "0",
        popular: [],
        memactive: "0",
        memload: "0",
        cpuload: "0",
        bandwidth: "0"
      }
    }).catch(err => {
      console.error(`Unable to post stats to StatCord: ${err}`);
    });
  };

  setInterval(updateStats, STATS_UPDATE_INTERVAL);
}