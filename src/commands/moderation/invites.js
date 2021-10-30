const { Permissions } = require('discord.js');
const { neutral } = require('../../util/formatter.js')('Kick Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class KickCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const target = await parser.getOption('target');
    const username = `${target.user.username}#${target.user.discriminator}`;

    let count = 0;
    const invites = given.guild.invites.cache.filter(i => i.inviter === target.user);
    await Promise.all(invites.map(async invite => {
      count += invite.uses;
    }));

    given.reply(neutral(`${username} has invited ${count} people.`));
  }

  constructor() {
    super({
      name: 'invites',
      desc: 'Counts the number of people someone has invited.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
      tags: [ 'moderation' ],
      guildOnly: true,
      options: [
        {
          name: 'target',
          type: 'member',
          desc: 'The user to check the invites of.',
          prompt: 'What user do you want me to check?',
          required: true
        },
      ]
    })
  }
};