// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { MessageEmbed, Permissions } = require('discord.js');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const { warning } = require('../../util/formatter.js')('Invite Command');
const { NAME, PREFIX, DEFAULT_COLOR } = require('../../config.json');
const process = require('process');
const os = require('os');
const GIGA_BYTE = Math.pow(1024, 3);

module.exports = class InfoCommand extends Command {
  async run(client, given, args) {
    // TODO: Clean up this code.
    const usedMem = Math.round(((os.totalmem() - os.freemem()) / GIGA_BYTE) * 1000) / 1000;
    const totalMem = Math.round((os.totalmem() / GIGA_BYTE) * 1000) / 1000;
    const uptime = new Date(process.uptime() * 1000).toISOString().substr(11, 8);

    const embed = new MessageEmbed()
      .setTitle(NAME)
      .setColor(DEFAULT_COLOR)
      .addField('Uptime', `${uptime}`, true)
      .addField('Memory Usage', `${usedMem} GB / ${totalMem} GB`, true)
      .addField('Guilds', client.guilds.cache.size.toString(), true) // This will do for now.
      .setFooter(`PID: ${process.pid} | Shard: ${client.shardId}`);
    given.reply({ embeds: [ embed ] });
  }

  constructor() {
    super({
      name: 'stats',
      desc: 'Provides information about the bot\'s state.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
    });
  }
}