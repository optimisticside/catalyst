// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Slowmode Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class BanCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const time = await parser.getOption('time');
    const username = `${given.member.user.username}#${given.member.user.discriminator}`;

    channel.setRateLimitPerUser(time, `Changed by ${username}`).catch(err => {
      given.reply(alert(`Unable to set slowmode to ${time} seconds.`));
      console.log(`Unable to set rate limit to ${time} seconds: ${err}`);
    });
  }

  constructor() {
    super({
      name: 'slowmode',
      desc: 'Toggles slowmode in a channel.',
      perms: [ Permissions.FLAGS.MANAGE_CHANNELS ],
      tags: [ 'moderation' ],
      guildOnly: true,
      options: [
        {
          name: 'time',
          type: 'time',
          desc: 'How long the channel should be locked for.',
          prompt: 'How long should the channel be locked for?',
          required: true
        }
      ]
    })
  }
};