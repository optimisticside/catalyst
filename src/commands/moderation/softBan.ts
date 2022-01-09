// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { GuildMember, Permissions } from 'discord.js';
import formatter from 'utils/formatter';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import OptionParser from 'utils/optionParser';
import CatalystClient from 'core/client';

const { alert, success } = formatter('Soft-ban Command');

export default class SoftbanCommand extends Command {
  async run(_client: CatalystClient, given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const target = (await parser.getOption('target')) as GuildMember;
    const reason = (await parser.getOption('reason')) as string | undefined;
    const guild = given.guild;
    if (!target || !guild) return;

    const username = `${target.user.username}#${target.user.discriminator}`;
    target
      .ban({ reason })
      .then(() => {
        guild.members
          .unban(target.user)
          .then(() => {
            given.reply(success(`Successfully soft-banned ${username}`));
          })
          .catch(err => {
            given.reply(alert(`Unable to unban ${username}`));
            this.logger.error(`Unable to unban user: ${err}`);
          });
      })
      .catch(err => {
        given.reply(alert(`Unable to ban ${username}`));
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
