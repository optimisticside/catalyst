// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Ban Command');
const OptionParser = require('../../util/optionParser.js');
const Command = require('../../structs/command.js');

module.exports = class BanCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const target = await parser.getOption('target');
    const reason = await parser.getOption('reason');
    const days = await parser.getOption('days');
    if (!target) return;

    // We can remove this after slash command
    // support is added.
    if (days && (days < 0 || days > 7)) {
      return given.reply(alert('Ban duration must be between 1 and 7 days'));
    }

    const username = `${target.user.username}#${target.user.discriminator}`;
    target.ban({ days, reason })
      .then(() => {
        given.reply(success(`Successfully banned ${username}`));
      })
      .catch(err => {
        given.reply(alert(`Unable to ban ${username}`));
        console.log(`Unable to ban user: ${err}`);
      });
  }

  constructor() {
    super({
      name: 'ban',
      desc: 'Bans the provided user.',
      perms: [ Permissions.FLAGS.BAN_MEMBERS ],
      tags: [ 'moderation' ],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'target',
          type: 'member',
          desc: 'The user to ban.',
          prompt: 'Who do you want to ban?',
          required: true
        },
        {
          name: 'reason',
          type: 'string',
          desc: 'Why you want to ban that user.',
          prompt: 'Why do you want to ban that user?',
          required: false
        },
        {
          name: 'days',
          type: 'integer',
          minimum: 1,
          maximum: 7,
          desc: 'How long the user should be banned for.',
          prompt: 'How many days should the user be banned for?',
          required: false
        }
      ]
    });
  }
};