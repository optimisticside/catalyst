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

type Service = (shardingManager: ShardingManager) => Promise<void>;
const { TOKEN, LIFETIME } = config;

const shardingManager = new ShardingManager(path.join(__dirname, 'core/shard.js'), {
  token: TOKEN
});

shardingManager.on(SharderEvents.READY, (cluster: Cluster) => {
  console.log(`Cluster ${cluster.id} spawned`);
});

shardingManager.on(SharderEvents.SHARD_READY, (shard: number) => {
  console.log(`Shard ${shard} connected to Discord`);
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
          console.error(`Unable to load ${fileName} service: ${err}`);
        });

        if (!result || !(result instanceof Function)) return;
        await result(shardingManager).catch(err => {
          console.error(`Unable to start ${fileName} service: ${err}`);
        });
      })
    );
  })();
}
