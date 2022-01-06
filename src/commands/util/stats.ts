// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { ColorResolvable, MessageEmbed, Permissions } from 'discord.js';
import Command, { CommandGiven } from 'structs/command';
import config from 'core/config';
import * as process from 'process';
import CatalystClient from 'core/client';

const GIGA_BYTE = Math.pow(1024, 3);
const { NAME, DEFAULT_COLOR } = config;

const fixedDigits = (num: number, count: number) => {
  const string = num.toString();
  const current = [...string].filter(c => c !== '.').length;
  if (current >= count) return string;
  return '0'.repeat(count - current) + string;
};

const toHrMinSec = (time: number) => {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / 1000 / 60) % 60);
  const hours = Math.floor((time / 1000 / 60 / 60) % 60);
  return `${fixedDigits(hours, 2)}:${fixedDigits(minutes, 2)}:${fixedDigits(seconds, 2)}`;
};

export default class StatsCommand extends Command {
  async run(client: CatalystClient, given: CommandGiven) {
    const memoryUsage = process.memoryUsage();
    const usedMem = Math.round((memoryUsage.heapUsed / GIGA_BYTE) * 1000) / 1000;
    const totalMem = Math.round((memoryUsage.heapTotal / GIGA_BYTE) * 1000) / 1000;
    const uptime = toHrMinSec(process.uptime() * 1000);

    const result = (await Promise.all([
      client.shard?.fetchClientValues('guilds.cache.size'),
      client.shard?.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
    ])) as Array<Array<number>>;
    const totalGuilds = result[0].reduce((acc, count) => acc + count, 0);
    const totalUsers = result[1].reduce((acc, count) => acc + count, 0);

    // TODO: Can we use the systeminformation library to do some
    // of this for us?
    const embed = new MessageEmbed()
      .setTitle(NAME)
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .addField('Guilds', totalGuilds.toString(), true)
      .addField('Users', totalUsers.toString(), true)
      .addField('Uptime', `${uptime}`, true)
      //.addField('Load Avg', os.loadavg().map(n => n.toFixed(3)).join(', '))
      .addField('Memory Usage', `${usedMem} GB / ${totalMem} GB`, true)
      .setFooter({ text: `PID: ${process.pid} | Cluster: ${client.shard?.id} | Shard: ${client.shard?.shardCount}` });
    given.reply({ embeds: [embed] });
  }

  constructor() {
    super({
      name: 'stats',
      desc: "Provides information about the bot's state.",
      perms: [Permissions.FLAGS.SEND_MESSAGES]
    });
  }
}
