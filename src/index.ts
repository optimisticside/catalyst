// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import 'module-alias/register';
import config from 'core/config';
import { ShardingManager, Cluster, SharderEvents } from 'kurasuta';
import cluster from 'cluster';
import glob from 'glob-promise';
import * as path from 'path';
import { resolveFile } from 'utils/file';
import CatalystClient from 'core/client';
import { Intents, Options } from 'discord.js';
import { createLogger } from 'utils/logger';
import Service from 'structs/service';

const { TOKEN, TOTAL_SHARDS, GUILDS_PER_SHARD, LIFETIME, REST_TIME_OFFSET } = config;

const logger = createLogger();
const shardingManager = new ShardingManager(path.join(__dirname, 'core/cluster'), {
  token: TOKEN,
  client: CatalystClient,
  shardCount: TOTAL_SHARDS,
  guildsPerShard: GUILDS_PER_SHARD,
  clientOptions: {
    partials: ['GUILD_MEMBER', 'REACTION'],
    restTimeOffset: REST_TIME_OFFSET ?? 500,
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_INVITES,
      Intents.FLAGS.GUILD_MEMBERS
    ],
    sweepers: {
      messages: {
        lifetime: 21600,
        interval: 43200
      }
    },
    makeCache: Options.cacheWithLimits({
      MessageManager: 25
    })
  }
});

shardingManager.on(SharderEvents.READY, (cluster: Cluster) => {
  logger.info(`Cluster ${cluster.id} spawned`);
});

shardingManager.on(SharderEvents.SHARD_READY, (shard: number) => {
  logger.info(`Shard ${shard} connected to Discord`);
});

shardingManager.spawn();

if (cluster.isPrimary) {
  if (LIFETIME) {
    setTimeout(() => {
      shardingManager.respawn = false;
      shardingManager.eval('process.exit(0)');
    }, LIFETIME * 1000);
  }

  (async () => {
    const serviceFiles = await glob(path.join(__dirname, 'services/**/*.js'));
    await Promise.all(
      serviceFiles.map(async file => {
        const fileName = path.basename(file, path.extname(file));
        const result = await resolveFile<Service>(file).catch(err => {
          logger.error(`Unable to load ${fileName} service: ${err}`);
        });

        if (!result || !(result instanceof Service)) return;
        await result.run(shardingManager).catch(err => {
          logger.error(`Unable to start ${fileName} service: ${err}`);
        });
      })
    );
  })();
}
