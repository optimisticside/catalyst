const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('AvatarPrune Command');
// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class PruneAvatarCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const reason = parser.getOption('reason');

    await Promise.all(given.guild.members.cache.map(async member => {
      if (member.user.avatarURL() !== member.user.defaultAvatarURL) return;
      await member.kick(reason);
    })).then(() => {
      given.reply(success('Successfully pruned members.'));
    }).catch(err => {
      given.reply(alert('Unable to prune some members.'));
      console.log(`Unable to avatar-prune members: ${err}`);
    });
  }

  constructor() {
    super({
      name: 'pruneAvatar',
      group: 'prune',
      groupMember: 'avatar',
      desc: 'Removes users without an avatar',
      perms: [ Permissions.FLAGS.KICK_MEMBERS ],
      tags: [ 'moderation' ],
      guildOnly: true,
      options: [
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