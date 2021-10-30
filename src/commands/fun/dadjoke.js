const { Permissions, MessageEmbed } = require('discord.js');
const { neutral } = require('../../util/formatter.js')('Purge Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const axios = require('axios');

module.exports = class DogCommand extends Command {
  async run(client, given, args) {
    const res = await axios.get('https://icanhazdadjoke.com', { headers: { Accept: 'application/json' } });
    const joke = res.data?.joke;
    
    console.log(res.data?.joke);
    given.reply(neutral(joke));
  }

  constructor() {
    super({
      name: 'dadjoke',
      desc: 'Sends a random dad joke.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
      tags: [ 'fun' ]
    })
  }
};