// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { Permissions, TextChannel } from 'discord.js';
import formatter from 'utils/formatter';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import OptionParser from 'utils/optionParser';
import CatalystClient from 'core/client';

const { alert, success } = formatter('Slowmode Command');

export default class SlowmodeCommand extends Command {
  async run(_client: CatalystClient, given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const time = await parser.getOption('time');

    const member = given.member;
    const channel = given.channel;
    if (!member || !(channel instanceof TextChannel)) return;
    const username = `${member.user.username}#${member.user.discriminator}`;

    channel
      .setRateLimitPerUser(time, `Changed by ${username}`)
      .then(() => {
        given.reply(success(`Changed slowmode to ${time} seconds.`));
      })
      .catch(err => {
        given.reply(alert(`Unable to set slowmode to ${time} seconds.`));
        this.logger.error(`Unable to set rate limit to ${time} seconds: ${err}`);
      });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'slowmode',
      desc: 'Toggles slowmode in a channel.',
      perms: [Permissions.FLAGS.MANAGE_MESSAGES],
      tags: ['moderation'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'time',
          type: 'integer',
          desc: 'How many seconds the slowmode should be set to.',
          prompt: 'What should the slowmode be set to?',
          required: true
        }
      ]
    });
  }
}
