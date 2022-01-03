// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { ShardingManager } from 'kurasuta';
import Service from 'structs/service';
import fetch from 'node-fetch';

const { STATS_UPDATE_INTERVAL, DBL_TOKEN, CLIENT_ID } = config;
const API_URL = `https://discordbotlist.com/api/v1/bots/${CLIENT_ID}/stats`;

export default class DblService extends Service {
  async run(shardingManager: ShardingManager) {
    if (!DBL_TOKEN) return;

    const updateStats = async () => {
      const result = (await Promise.all([
        shardingManager.fetchClientValues('guilds.cache.size'),
        shardingManager.eval('guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)')
      ])) as Array<Array<number>>;
      const guilds = result[0].reduce((acc, count) => acc + count, 0);
      const users = result[1].reduce((acc, count) => acc + count, 0);

      return await fetch(API_URL, {
        headers: { Authorization: DBL_TOKEN },
        body: JSON.stringify({ users, guilds })
      }).catch(err => {
        console.error(`Unable to post stats to DBL: ${err}`);
      });
    };

    setInterval(updateStats, STATS_UPDATE_INTERVAL);
  }

  constructor() {
    super('DiscordBotList');
  }
}
