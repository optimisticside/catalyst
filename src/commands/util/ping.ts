// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import CatalystClient from 'core/client';
import { CommandInteraction } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';

export default class PingCommand extends Command {
  async run(given: CommandGiven, _args: CommandArgs) {
    const reply = await given.reply('Pinging...');
    const deltaTime = (reply?.createdTimestamp ?? Date.now()) - given.createdTimestamp;
    const response = `:ping_pong: Pong! Took **${deltaTime}** ms (API latency: ${this.client.ws.ping} ms)`;

    if (given instanceof CommandInteraction) {
      given.editReply(response);
    } else {
      reply?.edit(response);
    }
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'ping',
      desc: "Gets the bot's latency.",
      tags: ['testing']
    });
  }
}
