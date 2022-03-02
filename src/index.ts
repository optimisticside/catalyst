// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import 'module-alias/register';
import config from 'core/config';
import { ShardingManager, SharderEvents } from 'kurasuta';
import cluster from 'cluster';
import glob from 'glob-promise';
import * as path from 'path';
import { resolveFile } from 'utils/file';
import CatalystClient from 'core/client';
import { Intents, Options } from 'discord.js';
import { createLogger } from 'utils/logger';
import Service from 'structs/service';

const { NAME, TOKEN, TOTAL_SHARDS, GUILDS_PER_SHARD, LIFETIME, REST_TIME_OFFSET } = config;

const logger = createLogger();
const shardingManager = new ShardingManager(path.join(__dirname, 'core/cluster'), {
  token: TOKEN,
  client: CatalystClient,
  shardCount: TOTAL_SHARDS,
  guildsPerShard: GUILDS_PER_SHARD,
  clientOptions: {
    partials: ['GUILD_MEMBER', 'REACTION'],
    restTimeOffset: REST_TIME_OFFSET ?? 500,
    makeCache: Options.cacheWithLimits({ MessageManager: 25 }),
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
    }
  }
});

shardingManager
  .on(SharderEvents.READY, cluster => logger.info(`Cluster ${cluster.id} spawned`))
  .on(SharderEvents.SHARD_READY, shard => logger.info(`Shard ${shard} connected`))
  .on(SharderEvents.SHARD_DISCONNECT, (_, shard) => logger.warn(`Shard ${shard} disconnected`))
  .on(SharderEvents.SHARD_RECONNECT, shard => logger.info(`Shard ${shard} reconnected`))
  .on(SharderEvents.SHARD_RESUME, (_, shard) => logger.info(`Shard ${shard} resumed`))
  .spawn();

if (process.env.NODE_ENV !== 'production') {
  shardingManager.on(SharderEvents.DEBUG, logger.debug.bind(logger));
}

if (cluster.isPrimary) {
  logger.info(`${NAME} starting (production: ${process.env.NODE_ENV === 'production'})`);
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
