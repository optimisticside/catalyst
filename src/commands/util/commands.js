const { Permissions, MessageEmbed } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Ban Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class CommandsCommand extends Command {
  async run(client, given, args) {
    const embed = new MessageEmbed()
      .setTitle('Commands')
      .setDescription(client.commandHandler.commands
        .filter(c => !c.hidden).map(c => c.name).join('\n'));
    given.reply({ embeds: [ embed ] });
  }

  constructor() {
    super({
      name: 'commands',
      desc: 'Lists all commands provided.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
      tags: [ 'utilities' ],
      aliases: [ 'cmds' ]
    })
  }
};