// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { GuildMember, Permissions } from 'discord.js';
import formatter from 'utils/formatter';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import OptionParser from 'utils/optionParser';
import CatalystClient from 'core/client';

const { alert, success } = formatter('Soft-ban Command');

export default class SoftbanCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const target = parser.getOption('target') as GuildMember;
    const reason = parser.getOption('reason') as string | undefined;
    const guild = given.guild;
    if (!target || !guild) return;

    target
      .ban({ reason })
      .then(() => {
        guild.members
          .unban(target.user)
          .then(() => {
            given.reply(success(`Successfully soft-banned ${target.user.tag}`));
          })
          .catch(err => {
            given.reply(alert(`Unable to unban ${target.user.tag}`));
            this.logger.error(`Unable to unban user: ${err}`);
          });
      })
      .catch(err => {
        given.reply(alert(`Unable to ban ${target.user.tag}`));
        this.logger.error(`Unable to ban user: ${err}`);
      });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'softBan',
      desc: 'Bans and unbans the provided user to delete messages.',
      perms: [Permissions.FLAGS.BAN_MEMBERS],
      tags: ['moderation'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'target',
          type: 'member',
          desc: 'The user to ban.',
          prompt: 'Who do you want me to ban?',
          required: true
        },
        {
          name: 'reason',
          type: 'string',
          desc: 'Why you want to ban that user',
          prompt: 'Why do you want to ban that user?',
          required: false
        }
      ]
    });
  }
}
