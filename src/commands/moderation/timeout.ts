// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { Permissions, GuildMember } from 'discord.js';
import formatter from 'utils/formatter';
import OptionParser from 'utils/optionParser';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';

const { success, alert } = formatter('Mute Command');

export default class MuteCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const target = parser.getOption('target') as GuildMember;
    const time = parser.getOption('time') as number;
    const reason = parser.getOption('reason') as string | undefined;
    if (!target) return;

    target
      .timeout(time, reason)
      .then(() => {
        given.reply(success(`Successfully muted ${target.user.tag}`));
      })
      .catch(err => {
        given.reply(alert(`Unable to mute ${target.user.tag}`));
        this.logger.error(`Unable to mute user: ${err}`);
      });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'timeout',
      desc: 'Puts the provided user on timeout.',
      aliases: ['mute'],
      perms: [Permissions.FLAGS.MODERATE_MEMBERS],
      tags: ['moderation'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'target',
          type: 'member',
          desc: 'The user to mute',
          prompt: 'Who do you want to mute?',
          required: true
        },
        {
          name: 'time',
          type: 'time',
          desc: 'How long you want to mute the user for',
          prompt: 'How long should the user be muted for?',
          required: true
        },
        {
          name: 'reason',
          type: 'string',
          desc: 'Why you want to kick that user',
          prompt: 'Why do you want to kick that user?',
          required: false
        }
      ]
    });
  }
}
