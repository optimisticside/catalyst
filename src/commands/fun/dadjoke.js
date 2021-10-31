// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions, MessageEmbed } = require('discord.js');
const { neutral } = require('../../util/formatter.js')('Purge Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const got = require('got');

module.exports = class DogCommand extends Command {
  async run(client, given, args) {
    const res = await got('https://icanhazdadjoke.com/', { headers: { 'Accept': 'application/json' } });
    console.log(res.body);
    const joke = JSON.parse(res.body)?.joke;
    
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