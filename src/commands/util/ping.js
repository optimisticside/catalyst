// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Interaction } = require('discord.js');
const Command = require('../../structs/command.js');

module.exports = class PingCommand extends Command {
  async run(client, given, args) {
    const reply = await given.reply('Pinging...');
    console.log(given, reply);
    const deltaTime = (reply?.createdTimestamp ?? Date.now()) - given.createdTimestamp;
    const response = `:ping_pong: Pong! Took **${deltaTime}** ms (API latency: ${client.ws.ping} ms)`;

    if (given instanceof Interaction) {
      given.editReply(response);
    } else {
      reply.edit(response);
    }
  }

  constructor() {
    super({
      name: 'ping',
      desc: 'Gets the bot\'s latency.',
      tags: [ 'testing' ],
    });
  }
};