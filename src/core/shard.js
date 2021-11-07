// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { TOKEN, REST_TIME_OFFSET, SHARD_LIFETIME } = require('../config.json');
const { Client, Intents } = require('discord.js');
const glob = require('glob');
const path = require('path');
const { promisify } = require('util');
const requireAsync = async f => require(f); //promisify(require.bind(this));

const modules = {};
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_INVITES,
    Intents.FLAGS.GUILD_MEMBERS
  ],
  partials: [ 'GUILD_MEMBER', 'REACTION' ],
  restTimeOffset: REST_TIME_OFFSET ?? 500
});

const loadModule = async file => {
  const module = await requireAsync(file).catch(err => {
    const fileName = path.basename(file, path.extname(file));
    console.error(`Unable to load ${fileName} module: ${err}`);
  });
  const object = new module(client);
  modules[object.name] = object;
  client[object.name] = object;
  /*
  let module;
  try {
    module = require(file);
  } catch(err) {
    console.error(`Unable to load module ${file}: ${err}`)
  }
  let object = new module(client);
  modules[object.name] = object;
  client[object.name] = object;
  */
}

const updateStatus = () => {
  client.user.setActivity(`${client.guilds.cache.size} servers`, { type: 'WATCHING' });
}

const initModules = async () => {
  await Promise.all(Object.entries(modules).map(async ([ name, module ]) => {
    if (!module.load) return;
    module.load(modules, client);
  }));
}

process.on('message', async message => {
  if (message.type !== 'shardId') return;
  client.shardId = message.data.shardId;
});

let moduleFiles = glob.sync(path.join(__dirname + '/../modules/*.js'))
  .concat(glob.sync(path.join(__dirname + '../modules/*/init.js')));

(async () => {
  await Promise.all(moduleFiles.map(loadModule));
  await initModules();
  await client.login(TOKEN);

  console.log('Ready');
  updateStatus();
  setInterval(updateStatus, 5000);
})();

if (SHARD_LIFETIME) {
  setTimeout(() => {
    process.exit();
  }, SHARD_LIFETIME * 1000);
}