// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { Permissions, TextChannel } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
import formatter from 'utils/formatter';
import OptionParser from 'utils/optionParser';

const { success, alert } = formatter('Announce Command');

export default class AnnounceCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const channelId = parser.getOption('channel') as string;
    const message = parser.getOption('message') as string;
    if (!channelId || !message) return;

    const guild = given.guild;
    const channel = guild?.channels.cache.get(channelId);
    if (!channel || !(channel instanceof TextChannel)) return;

    channel
      .send(message)
      .then(() => {
        given.reply(success('Successfully sent message'));
      })
      .catch(err => {
        given.reply(alert('Unable to send message in channel'));
        this.logger.error(`Unable to send message ${message} in ${channel}: ${err}`);
      });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'announce',
      desc: 'Announces a message in the given channel.',
      userPerms: [Permissions.FLAGS.MANAGE_GUILD],
      botPerms: [Permissions.FLAGS.SEND_MESSAGES],
      tags: ['guild'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'channel',
          type: 'channel',
          desc: 'The channel to send the message in.',
          prompt: 'Where do you want to send the message?',
          required: true
        },
        {
          name: 'message',
          type: 'string',
          desc: 'The message to send.',
          prompt: 'What message do you want to send?',
          required: true
        }
      ]
    });
  }
}
