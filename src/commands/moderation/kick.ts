// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { Permissions, GuildMember } from 'discord.js';
import formatter from 'utils/formatter';
import OptionParser from 'utils/optionParser';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';

const { success, alert } = formatter('Kick Command');

export default class KickCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const target = parser.getOption('target') as GuildMember;
    const reason = parser.getOption('reason') as string | undefined;
    if (!target) return;

    target
      .kick(reason)
      .then(() => {
        given.reply(success(`Successfully kicked ${target.user.tag}`));
      })
      .catch(err => {
        given.reply(alert(`Unable to kick ${target.user.tag}`));
        this.logger.error(`Unable to kick user: ${err}`);
      });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'kick',
      desc: 'Kicks the provided user.',
      perms: [Permissions.FLAGS.KICK_MEMBERS],
      tags: ['moderation'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'target',
          type: 'member',
          desc: 'The user to kick',
          prompt: 'Who do you want to kick?',
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
