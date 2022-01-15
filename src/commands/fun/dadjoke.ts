// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { Permissions } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
import fetch from 'node-fetch';
import formatter from 'utils/formatter';

const { neutral } = formatter('Dadjoke Command');

export default class DadJokeCommand extends Command {
  async run(given: CommandGiven, _args: CommandArgs) {
    const res = await fetch('https://icanhazdadjoke.com/', {
      headers: { Accept: 'application/json' }
    });
    const joke = (await res.json())?.joke as string;

    given.reply(neutral(joke));
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'dadjoke',
      desc: 'Sends a random dad joke.',
      perms: [Permissions.FLAGS.SEND_MESSAGES],
      tags: ['fun']
    });
  }
}
