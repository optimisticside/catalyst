// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { Permissions, MessageEmbed } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
import fetch from 'node-fetch';

export default class DogCommand extends Command {
  async run(given: CommandGiven, _args: CommandArgs) {
    const res = await fetch('https://dog.ceo/api/breeds/image/random/');
    const url = ((await res.json()) as any)?.message as string;

    const embed = new MessageEmbed().setTitle(':dog: Woof!').setURL(url).setImage(url);
    given.reply({ embeds: [embed] });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'dog',
      desc: 'Sends a random picture of a dog.',
      perms: [Permissions.FLAGS.SEND_MESSAGES],
      tags: ['fun']
    });
  }
}
