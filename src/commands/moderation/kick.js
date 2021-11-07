// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Kick Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class KickCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const target = await parser.getOption('target');
    const reason = await parser.getOption('reason');
    if (!target) return;
    const username = `${target.user.username}#${target.user.discriminator}`;

    target.kick(reason).then(() => {
      given.reply(success(`Successfully kicked ${username}`));
    }).catch(err => {
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
          prompt: 'Who do you want me to kick?',
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
    })
  }
};