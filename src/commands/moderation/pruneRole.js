// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { alert } = require('../../util/formatter.js')('AvatarPrune Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class PruneAvatarCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const role = parser.getOption('role');
    const reason = parser.getOption('reason');

    await Promise.all(given.guild.members.map(async member => {
      if (member.roles.cache.get(role.id)) return;
      member.kick(reason);
    })).then(() => {
      given.reply(success('Successfully pruned members.'));
    }).catch(err => {
      given.reply(alert('Unable to prune some members.'));
      console.log(`Unable to avatar-prune members: ${err}`);

    });
  }

  constructor() {
    super({
      name: 'pruneRole',
      group: 'prune',
      groupMember: 'role',
      desc: 'Removes users without the given role',
      perms: [ Permissions.FLAGS.KICK_MEMBERS ],
      tags: [ 'moderation' ],
      guildOnly: true,
      options: [
        {
          name: 'role',
          type: 'role',
          desc: 'The role to prune members without.',
          prompt: 'What role should not be pruned?',
          required: true
        },
        {
          name: 'reason',
          type: 'string',
          desc: 'Why these members should be pruned',
          prompt: 'Why are your reason for pruning these members?',
          required: false
        }
      ]
    });
  }
};