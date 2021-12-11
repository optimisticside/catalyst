// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { neutral } = require('../../util/formatter.js')('DadJoke Command');
const Command = require('../../structs/command.js');
const got = require('got');

module.exports = class DogCommand extends Command {
  async run(client, given, args) {
    const res = await got('https://icanhazdadjoke.com/', { headers: { 'Accept': 'application/json' } });
    const joke = JSON.parse(res.body)?.joke;

    given.reply(neutral(joke));
  }

  constructor() {
    super({
      name: 'dadjoke',
      desc: 'Sends a random dad joke.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
      tags: [ 'fun' ]
    });
  }
};