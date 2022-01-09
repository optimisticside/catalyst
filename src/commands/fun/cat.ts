// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { Permissions, MessageEmbed } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
import fetch from 'node-fetch';

export default class CatCommand extends Command {
  async run(_client: CatalystClient, given: CommandGiven, _args: CommandArgs) {
    const res = await fetch('https://aws.random.cat/meow');
    const url = ((await res.json()) as any)?.file as string;

    const embed = new MessageEmbed().setTitle(':cat: Meowww...').setURL(url).setImage(url);
    given.reply({ embeds: [embed] });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'cat',
      desc: 'Sends a random picture of a cat.',
      perms: [Permissions.FLAGS.SEND_MESSAGES],
      tags: ['fun']
    });
  }
}
