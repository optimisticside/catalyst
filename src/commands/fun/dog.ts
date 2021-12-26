// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { Permissions, MessageEmbed } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
import fetch from 'node-fetch';

export default class DogCommand extends Command {
  async run(_client: CatalystClient, given: CommandGiven, _args: CommandArgs) {
    const res = await fetch('https://dog.ceo/api/breeds/image/random/');
    const url = (await res.json() as any)?.message;

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
    });
  }
};