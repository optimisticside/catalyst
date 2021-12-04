// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions, MessageEmbed } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Ban Command');
const { DEFAULT_COLOR } = require('../../util/configParser.js');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class CommandsCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const tag = await parser.getOption('tag');
    const commands = client.commandHandler.commands
      .filter(c => !c.hidden && (!tag || c.tags.find(t => t === tag)));

    const embed = new MessageEmbed()
      .setTitle('Commands')
      .setColor(DEFAULT_COLOR)
      .setDescription(commands.map(c => c.name).join('\n'));
    given.reply({ embeds: [ embed ] });
  }

  constructor() {
    super({
      name: 'commands',
      desc: 'Lists all commands provided.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
      tags: [ 'utilities' ],
      aliases: [ 'cmds' ],
      options: [
        {
          name: 'tag',
          type: 'string',
          desc: 'The tag to filter commands by',
          prompt: 'What tag do you want to filter by?',
          required: false
        }
      ]
    })
  }
};