// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Ban Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class BanCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const channel = await parser.getOption('channel');
    const message = await parser.getOption('message');
    if (!channel || !message) return;

    channel.send(message).then(() => {
      given.reply(success('Successfully sent message'));
    }).catch(err => {
      given.reply(alert('Unable to send message in channel'));
      console.log(`Unable to send message ${message} in ${channel}: ${err}`);
    });
  }

  constructor() {
    super({
      name: 'announce',
      desc: 'Announces a message in the given channel.',
      userPerms: [ Permissions.FLAGS.MANAGE_GUILD ],
      botPerms: [ Permissions.FLAGS.SEND_MESSAGES ],
      tags: [ 'guild' ],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'channel',
          type: 'channel',
          desc: 'The channel to send the message in.',
          prompt: 'Where do you want me to send the message?',
          required: true
        },
        {
          name: 'message',
          type: 'string',
          desc: 'The message to send.',
          prompt: 'What message do you want me to send?',
          required: true
        },
      ]
    })
  }
};