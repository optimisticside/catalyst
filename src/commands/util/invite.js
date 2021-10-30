const Command = require('../../structs/command.js');
const { neutral } = require('../../util/formatter.js')('Invite Command');
const { CLIENT_ID } = require('../../config.json');

module.exports = class InviteCommand extends Command {
  async run(client, given, args) {
    const invite = `https://discord.com/oauth2/authorize?&client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=2134207679`;
    given.reply(neutral(`Here's the link to invite me: ${invite}`));
  }

  constructor() {
    super({
      name: 'invite',
      desc: 'Sends a link to invite the bot.'
    })
  }
};