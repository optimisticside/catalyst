// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { CommandInteraction, Permissions } from 'discord.js';
import formatter from 'utils/formatter';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import OptionParser from 'utils/optionParser';
import CatalystClient from 'core/client';

const { alert, success } = formatter('Ban Command');

export default class UnbanCommand extends Command {
  async run(_client: CatalystClient, given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const id = await parser.getOption('target');

    const guild = given.guild;
    const user = given instanceof CommandInteraction ? given.user : given.author;
    if (!guild) return;

    guild.bans
      .remove(id, `Unbanned by ${user.id}`)
      .then(() => {
        given.reply(success(`Successfully unbanned user`));
      })
      .catch(err => {
        given.reply(alert(`Unable to ban user`));
        console.log(`Unable to unban ${id}: ${err}`);
      });
  }

  constructor() {
    super({
      name: 'unban',
      desc: 'Unbans the provided user.',
      perms: [Permissions.FLAGS.BAN_MEMBERS],
      tags: ['moderation'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'target',
          type: 'string',
          desc: 'The ID of the user to ban.',
          prompt: 'What is the ID of the user to unban?',
          required: true
        }
      ]
    });
  }
}
