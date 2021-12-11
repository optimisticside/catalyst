// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions, MessageEmbed } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Cat Command');
const Command = require('../../structs/command.js');
const got = require('got');

module.exports = class DogCommand extends Command {
  async run(client, given, args) {
    const res = await got('https://aws.random.cat/meow');
    const url = JSON.parse(res.body)?.file;

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
    });
  }
};