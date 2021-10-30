const { Permissions, MessageEmbed } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Purge Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const axios = require('axios');

module.exports = class DogCommand extends Command {
  async run(client, given, args) {
    const res = await axios.get('https://aws.random.cat/meow');
    const url = res.data?.file;

    const embed = new MessageEmbed()
      .setTitle(':cat: Meowww...')
      .setURL(url)
      .setImage(url);
    given.reply({ embeds: [ embed ] });
  }

  constructor() {
    super({
      name: 'cat',
      desc: 'Sends a random picture of a cat.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
      tags: [ 'fun' ]
    })
  }
};