// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { ColorResolvable, MessageEmbed, Permissions } from 'discord.js';
import Command, { CommandGiven } from 'structs/command';
import config from 'core/config';
import CatalystClient from 'core/client';
import * as process from 'process';
import * as os from 'os';

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
    const mem = process.memoryUsage();
    const load = os.loadavg();

    const usedMem = (mem.heapUsed / GIGA_BYTE).toFixed(3);
    const totalMem = (mem.heapTotal / GIGA_BYTE).toFixed(3);
    const uptime = toHrMinSec(process.uptime() * 1000);

    const result = (await Promise.all([
      client.shard?.fetchClientValues('guilds.cache.size'),
      client.shard?.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
    ])) as Array<Array<number>>;
    const totalGuilds = result[0].reduce((acc, count) => acc + count, 0);
    const totalUsers = result[1].reduce((acc, count) => acc + count, 0);

    const embed = new MessageEmbed()
      .setTitle(NAME)
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .addField('Guilds', totalGuilds.toString(), true)
      .addField('Users', totalUsers.toString(), true)
      .addField('Uptime', `${uptime}`, true)
      .addField('Avg Load', load.map(n => n.toFixed(3)).join(', '))
      .addField('Memory Usage', `${usedMem} GB / ${totalMem} GB`, true)
      .setFooter({ text: `PID: ${process.pid} | Cluster: ${client.shard?.id} | Shard: ${client.shard?.shardCount}` });
    given.reply({ embeds: [embed] });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'stats',
      desc: "Provides information about the bot's state.",
      perms: [Permissions.FLAGS.SEND_MESSAGES]
    });
  }
}
