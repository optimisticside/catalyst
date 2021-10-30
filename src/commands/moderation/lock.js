const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Lock Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class BanCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const channel = await parser.getOption('channel');
    const time = await parser.getOption('time');
    const reason = await parser.getOption('reason');


  }

  constructor() {
    super({
      name: 'lock',
      desc: 'Locks a channel.',
      perms: [ Permissions.FLAGS.BAN_MEMBERS ],
      tags: [ 'moderation' ],
      guildOnly: true,
      options: [
        {
          name: 'channel',
          type: 'channel',
          desc: 'The channel to lock.',
          prompt: 'What channel do you want to lock?',
          required: true
        },
        {
          name: 'time',
          type: 'time',
          desc: 'How long the channel should be locked for.',
          prompt: 'How long should the channel be locked for?',
          required: false
        },
        {
          name: 'reason',
          type: 'string',
          desc: 'Why the channel should be locked',
          prompt: 'Why should the channel be locked?',
          required: false
        }
      ]
    })
  }
};