// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { ShardingManager } from 'kurasuta';
import Service from 'structs/service';
import si from 'systeminformation';
import fetch from 'node-fetch';

const { STATCORD_TOKEN, CLIENT_ID, STATS_UPDATE_INTERVAL } = config;
const API_URL = 'https://api.statcord.com/v3/stats';

export default class StatcordService extends Service {
  async run(shardingManager: ShardingManager) {
    if (!STATCORD_TOKEN) return;

    let lastUsedBytes = 0;
    const getUsedBytes = async () => {
      const stats = await si.networkStats();
      return stats.reduce((prev, current) => prev + current.rx_bytes, 0);
    };

    const updateStats = async () => {
      const result = (await Promise.all([
        shardingManager.fetchClientValues('guilds.cache.size'),
        shardingManager.fetchClientValues('guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)')
      ])) as Array<Array<number>>;

      const servers = result[0].reduce((acc, count) => acc + count, 0);
      const users = result[1].reduce((acc, count) => acc + count, 0);
      const mem = await si.mem();
      const load = await si.currentLoad();

      lastUsedBytes = lastUsedBytes <= 0 ? await getUsedBytes() : lastUsedBytes;
      const usedBytes = await getUsedBytes();
      const bandwidth = (usedBytes - lastUsedBytes).toString();
      lastUsedBytes = usedBytes;

      return await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          id: CLIENT_ID,
          key: STATCORD_TOKEN,
          servers,
          users,
          active: [],
          commands: '0',
          popular: [],
          memactive: mem.active.toString(),
          memload: Math.round((mem.active / mem.total) * 100).toString(),
          cpuload: Math.round(load.currentLoad).toString(),
          bandwidth
        })
      }).catch(err => {
        this.logger.error(`Unable to post stats to StatCord: ${err}`);
      });
    };

    setInterval(updateStats, STATS_UPDATE_INTERVAL);
  }

  constructor() {
    super('Statcord');
  }
}
