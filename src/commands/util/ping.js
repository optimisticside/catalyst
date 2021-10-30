// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Command = require('../../structs/command.js');

module.exports = class PingCommand extends Command {
  async run(client, given, args) {
    given.reply('pong');
  }

  constructor() {
    super({
      name: 'ping',
      desc: 'Gets the bot\'s latency.',
      tags: [ 'testing' ],
    });
  }
};