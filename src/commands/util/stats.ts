// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { ColorResolvable, MessageEmbed, Permissions } from 'discord.js';
import Command, { CommandGiven } from 'structs/command';
//import formatter from 'utils/formatter';
import config from 'core/config';
import * as process from 'process';
import CatalystClient from 'core/client';

const GIGA_BYTE = Math.pow(1024, 3);
const { NAME, DEFAULT_COLOR } = config;
//const { warning } = formatter('Stats Command');

export default class InfoCommand extends Command {
  async run(client: CatalystClient, given: CommandGiven) {
    const memoryUsage = process.memoryUsage();
    const usedMem = Math.round((memoryUsage.heapUsed / GIGA_BYTE) * 1000) / 1000;
    const totalMem = Math.round((memoryUsage.heapTotal / GIGA_BYTE) * 1000) / 1000;
    const uptime = new Date(process.uptime() * 1000).toISOString().substr(11, 8);

    const result = await Promise.all([
      client.shard?.fetchClientValues('guilds.cache.size'),
      client.shard?.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
    ]) as Array<Array<number>>;
    const totalGuilds = result[0].reduce((acc, count) => acc + count, 0);
    const totalUsers = result[1].reduce((acc, count) => acc + count, 0);

    const embed = new MessageEmbed()
      .setTitle(NAME)
      .setColor(DEFAULT_COLOR as ColorResolvable)
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
};