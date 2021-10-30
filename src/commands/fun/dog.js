// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions, MessageEmbed } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Purge Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const axios = require('axios');

module.exports = class DogCommand extends Command {
  async run(client, given, args) {
    const res = await axios.get('https://dog.ceo/api/breeds/image/random/');
    const url = res.data?.message;

    const embed = new MessageEmbed()
      .setTitle(':dog: Woof!')
      .setURL(url)
      .setImage(url);
    given.reply({ embeds: [ embed ] });
  }

  constructor() {
    super({
      name: 'dog',
      desc: 'Sends a random picture of a dog.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
      tags: [ 'fun' ]
    })
  }
};