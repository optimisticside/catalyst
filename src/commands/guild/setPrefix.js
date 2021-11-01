// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions, MessageEmbed } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Set-Prefix Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class CommandsCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const prefix = await parser.getOption('prefix');

    await client.database.setGuild(given.guild.id, 'prefix', prefix).then(() => {
      given.reply(success('Successfully changed guild prefix'));
    }).catch(err => {
      given.reply(alert('Unable to change guild prefix'));
      console.log(`Unable to update guild prefix: ${err}`);
    });
  }

  constructor() {
    super({
      name: 'setPrefix',
      group: 'set',
      groupMember: 'prefix',
      desc: 'Sets the guild\'s custom prefix.',
      perms: [ Permissions.FLAGS.MANAGE_GUILD ],
      tags: [ 'guild' ],
      options: [
        {
          name: 'prefix',
          type: 'string',
          desc: 'The new group prefix.',
          prompt: 'What do you want the new group prefix to be?',
          required: true
        }
      ]
    })
  }
};