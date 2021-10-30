const { TOKEN, SHARD_LIFETIME } = require('../config.json');
const { Client, Intents } = require('discord.js');
const glob = require('glob');
const path = require('path');
const { promisify } = require('util');
const requireAsync = async f => require(f); //promisify(require.bind(this));

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });
const modules = {};

async function loadModules(files) {
  await Promise.all(files.map(async file => {
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
  }));
}

async function initModules() {
  await Promise.all(Object.entries(modules).map(async ([ name, module ]) => {
    if (!module.load) return;
    module.load(modules, client);
  }));
}

let moduleFiles = glob.sync(path.join(__dirname + '/../modules/*.js'))
  .concat(glob.sync(path.join(__dirname + '../modules/**/init.js')));

(async () => {
  await loadModules(moduleFiles);
  await initModules();
  await client.login(TOKEN);

  console.log('Ready');
  client.user.setActivity('with other bots', { type: 'PLAYING' });
})();

if (SHARD_LIFETIME) {
  setTimeout(() => {
    process.exit();
  }, SHARD_LIFETIME * 1000);
}