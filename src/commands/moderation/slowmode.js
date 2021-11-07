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

    given.channel.setRateLimitPerUser(time, `Changed by ${username}`).catch(err => {
      given.reply(alert(`Unable to set slowmode to ${time} seconds.`));
      console.log(`Unable to set rate limit to ${time} seconds: ${err}`);
    });
  }

  constructor() {
    super({
      name: 'slowmode',
      desc: 'Toggles slowmode in a channel.',
      perms: [ Permissions.FLAGS.MANAGE_MESSAGES ],
      tags: [ 'moderation' ],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'time',
          type: 'integer',
          desc: 'How many seconds the slowmode should be set to.',
          prompt: 'What should the slowmode be set to?',
          required: true
        }
      ]
    })
  }
};