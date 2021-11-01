// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { MessageEmbed, Permissions } = require('discord.js');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const { warning } = require('../../util/formatter.js')('Invite Command');
const { NAME, PREFIX, DEFAULT_COLOR } = require('../../config.json');

module.exports = class InfoCommand extends Command {
  async run(client, given, args) {
    const embed = new MessageEmbed()
      .setTitle(NAME)
      .setColor(DEFAULT_COLOR)
      .setDescription(`Hello! I'm ${NAME}. I was made with node.js using the Discord.js library. I was created to be convenient and easy-to-use. I am running ${client.shard.ids.length.toString()} shard${client.shard.ids.length === 1 ? '' : 's'}.`);
    given.reply({ embeds: [ embed ] });
  }

  constructor() {
    super({
      name: 'info',
      desc: 'Provides information about the bot\'s state.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
    });
  }
}