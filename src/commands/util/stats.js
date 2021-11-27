// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { MessageEmbed, Permissions } = require('discord.js');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const { warning } = require('../../util/formatter.js')('Invite Command');
const { NAME, PREFIX, DEFAULT_COLOR } = require('../../config.json');
const process = require('process');
const GIGA_BYTE = Math.pow(1024, 3);

module.exports = class InfoCommand extends Command {
  async run(client, given, args) {
    const memoryUsage = process.memoryUsage();
    const usedMem = Math.round((memoryUsage.heapUsed / GIGA_BYTE) * 1000) / 1000;
    const totalMem = Math.round((memoryUsage.heapTotal / GIGA_BYTE) * 1000) / 1000;
    const uptime = new Date(process.uptime() * 1000).toISOString().substr(11, 8);

    const result = await Promise.all([
      client.shard.fetchClientValues('guilds.cache.size'),
      client.shard.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
    ]);
    const totalGuilds = result[0].reduce((acc, count) => acc + count, 0);
    const totalUsers = result[1].reduce((acc, count) => acc + count, 0);

    const embed = new MessageEmbed()
      .setTitle(NAME)
      .setColor(DEFAULT_COLOR)
      .addField('Guilds', totalGuilds.toString(), true)
      .addField('Users', totalUsers.toString(), true)
      .addField('Uptime', `${uptime}`, true)
      //.addField('Load Avg', os.loadavg().map(n => n.toFixed(3)).join(', '))
      .addField('Memory Usage', `${usedMem} GB / ${totalMem} GB`, true)
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