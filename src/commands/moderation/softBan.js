// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Softban Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class BanCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const target = await parser.getOption('target');
    const reason = await parser.getOption('reason');
    const days = await parser.getOption('days');
    if (!target) return;
    const username = `${target.user.username}#${target.user.discriminator}`;

    if (days && (days < 0 || days > 7)) {
      return given.reply(alert('Ban duration must be between 1 and 7 days'));
    }
    target.ban({ days, reason }).then(() => {
      given.guild.members.unban(target.user).then(() => {
        given.reply(success(`Successfully soft-banned ${username}`));
      }).catch(err => {
        given.reply(alert(`Unable to unban ${username}`));
        console.log(`Unable to unban user: ${err}`);
      });
    }).catch(err => {
      given.reply(alert(`Unable to ban ${username}`));
      console.log(`Unable to ban user: ${err}`);
    });
  }

  constructor() {
    super({
      name: 'softBan',
      desc: 'Bans and unbans the provided user to delete messages.',
      perms: [ Permissions.FLAGS.BAN_MEMBERS ],
      tags: [ 'moderation' ],
      guildOnly: true,
      options: [
        {
          name: 'target',
          type: 'member',
          desc: 'The user to ban.',
          prompt: 'Who do you want me to ban?',
          required: true
        }
      ]
    })
  }
};