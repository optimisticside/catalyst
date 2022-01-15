// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { GuildMember, Permissions } from 'discord.js';
import formatter from 'utils/formatter';
import OptionParser from 'utils/optionParser';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
const { alert, success } = formatter('Ban Command');

export default class BanCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const target = (await parser.getOption('target')) as GuildMember;
    const reason = (await parser.getOption('reason')) as string | undefined;
    const days = (await parser.getOption('days')) as number | undefined;
    if (!target) return;

    // We can remove this after slash command
    // support is added.
    if (days && (days < 0 || days > 7)) {
      given.reply(alert('Ban duration must be between 1 and 7 days'));
      return;
    }

    const username = `${target.user.username}#${target.user.discriminator}`;
    target
      .ban({ days, reason })
      .then(() => {
        given.reply(success(`Successfully banned ${username}`));
      })
      .catch(err => {
        given.reply(alert(`Unable to ban ${username}`));
        this.logger.error(`Unable to ban user: ${err}`);
      });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'ban',
      desc: 'Bans the provided user.',
      perms: [Permissions.FLAGS.BAN_MEMBERS],
      tags: ['moderation'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'target',
          type: 'member',
          desc: 'The user to ban.',
          prompt: 'Who do you want to ban?',
          required: true
        },
        {
          name: 'reason',
          type: 'string',
          desc: 'Why you want to ban that user.',
          prompt: 'Why do you want to ban that user?',
          required: false
        },
        {
          name: 'days',
          type: 'integer',
          minimum: 1,
          maximum: 7,
          desc: 'How long the user should be banned for.',
          prompt: 'How many days should the user be banned for?',
          required: false
        }
      ]
    });
  }
}
