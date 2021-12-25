// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { Permissions, GuildMember } from 'discord.js';
import formatter from 'utils/formatter';
import OptionParser from 'utils/optionParser';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';

const { success, alert } = formatter('Kick Command');

export default class KickCommand extends Command {
  async run(_client: CatalystClient, given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const target = await parser.getOption('target') as GuildMember;
    const reason = await parser.getOption('reason') as string | undefined;
    if (!target) return;

    const username = `${target.user.username}#${target.user.discriminator}`;
    target.kick(reason)
      .then(() => {
        given.reply(success(`Successfully kicked ${username}`));
      })
      .catch(err => {
        given.reply(alert(`Unable to kick ${username}`));
        console.log(`Unable to kick user: ${err}`);
      });
  }

  constructor() {
    super({
      name: 'kick',
      desc: 'Kicks the provided user.',
      perms: [ Permissions.FLAGS.KICK_MEMBERS ],
      tags: [ 'moderation' ],
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
};