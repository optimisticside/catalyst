// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { ShardingManager } from 'discord.js';
import fetch from 'node-fetch';
import Service from 'structs/service';

const { TOPGG_TOKEN, CLIENT_ID, STATS_UPDATE_INTERVAL } = config;
const API_URL = `https://top.gg/api/bots/${CLIENT_ID}/stats`;

export default class TopggService extends Service {
  async run(shardingManager: ShardingManager) {
    if (!TOPGG_TOKEN) return;

    const updateStats = async () => {
      const guildCounts = await shardingManager.fetchClientValues('guilds.cache.size') as Array<number>;
      const guilds = guildCounts.reduce((acc, count) => acc + count, 0);
      const shards = shardingManager.shards.size;

      return await fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: TOPGG_TOKEN },
        body: JSON.stringify({ server_count: guilds, shard_count: shards })
      }).catch(err => {
        console.error(`Unable to post stats to Top.gg: ${err}`);
      });
    };

    setInterval(updateStats, STATS_UPDATE_INTERVAL);
  }

  constructor() {
    super('Top.gg');
  }
}