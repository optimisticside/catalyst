// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { ShardingManager } from 'kurasuta';
import Service from 'structs/service';
import fetch from 'node-fetch';

const { DISCORD_LABS_TOKEN, CLIENT_ID, STATS_UPDATE_INTERVAL } = config;
const API_URL = `https://bots.discordlabs.org/v2/bot/${CLIENT_ID}/stats`;

export default class DiscordLabsService extends Service {
  async run(shardingManager: ShardingManager) {
    if (!DISCORD_LABS_TOKEN) return;

    const updateStats = async () => {
      const guildCounts = (await shardingManager.fetchClientValues('guilds.cache.size')) as Array<number>;
      const guilds = guildCounts.reduce((acc, count) => acc + count, 0);
      const shards = shardingManager.shardCount;

      return await fetch(API_URL, {
        method: 'POST',
        headers: { authorization: DISCORD_LABS_TOKEN },
        body: JSON.stringify({ server_count: guilds, shard_count: shards })
      }).catch(err => {
        console.error(`Unable to post stats to Discord Labs: ${err}`);
      });
    };

    setInterval(updateStats, STATS_UPDATE_INTERVAL);
  }

  constructor() {
    super('Discord-Labs');
  }
}
