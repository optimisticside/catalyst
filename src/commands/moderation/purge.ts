// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { TextChannel, Permissions } from 'discord.js';
import formatter from 'utils/formatter';
import OptionParser from 'utils/optionParser';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';

const { alert, success } = formatter('Purge Command');

export default class PurgeCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const amount = (await parser.getOption('amount')) as number;
    const channel = given.channel;

    if (!(channel instanceof TextChannel)) return;
    channel
      .bulkDelete(amount, true)
      .then(messages => {
        given.reply(success(`Successfully deleted ${messages.size} messages`));
      })
      .catch(err => {
        given.reply(alert(`Unable to delete messages.`));
        this.logger.error(`Unable to kick user: ${err}`);
      });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'purge',
      desc: 'Deletes the given amount of messages.',
      perms: [Permissions.FLAGS.MANAGE_MESSAGES],
      tags: ['moderation'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'amount',
          type: 'integer',
          desc: 'The number of messages to delete.',
          prompt: 'How many messages should I delete?',
          required: true
        }
      ]
    });
  }
}
