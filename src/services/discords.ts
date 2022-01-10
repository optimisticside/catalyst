// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { ShardingManager } from 'kurasuta';
import fetch from 'node-fetch';
import Service from 'structs/service';

const { DISCORDS_TOKEN, CLIENT_ID, STATS_UPDATE_INTERVAL } = config;
const API_URL = `https://discords.com/bots/api/bot/${CLIENT_ID}`;

export default class DiscordsService extends Service {
  async run(shardingManager: ShardingManager) {
    if (!DISCORDS_TOKEN) return;

    const updateStats = async () => {
      const guildCounts = (await shardingManager.fetchClientValues('guilds.cache.size')) as Array<number>;
      const guilds = guildCounts.reduce((acc, count) => acc + count, 0);

      return await fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: DISCORDS_TOKEN },
        body: JSON.stringify({ server_count: guilds })
      }).catch(err => {
        this.logger.error(`Unable to post stats to Discords: ${err}`);
      });
    };

    setInterval(updateStats, STATS_UPDATE_INTERVAL);
  }

  constructor() {
    super('Discords');
  }
}
