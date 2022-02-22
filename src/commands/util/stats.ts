// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { ColorResolvable, MessageEmbed, Permissions } from 'discord.js';
import Command, { CommandGiven } from 'structs/command';
import config from 'core/config';
import CatalystClient from 'core/client';
import * as si from 'systeminformation';
import * as process from 'process';

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
  async run(given: CommandGiven) {
    if (!this.client.user) return;

    const cpuLoad = (await si.currentLoad()).currentLoad;
    const mem = await si.mem();

    const usedMem = (mem.used / GIGA_BYTE).toFixed(3);
    const totalMem = (mem.total / GIGA_BYTE).toFixed(3);
    const uptime = toHrMinSec(process.uptime() * 1000);

    const result = (await Promise.all([
      this.client.shard?.fetchClientValues('guilds.cache.size'),
      this.client.shard?.fetchClientValues('channels.cache.size'),
      this.client.shard?.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))
    ])) as Array<Array<number>>;
    const totalGuilds = result[0].reduce((acc, count) => acc + count, 0);
    const totalChannels = result[1].reduce((acc, count) => acc + count, 0);
    const totalUsers = result[2].reduce((acc, count) => acc + count, 0);

    const embed = new MessageEmbed()
      .setTitle(NAME)
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setThumbnail(this.client.user?.displayAvatarURL())
      .setDescription(`Cluster ${this.client.cluster?.id} on shard ${this.client.shard?.id}`)
      .addField('Stats', `Guilds: \`${totalGuilds}\`\nUsers: \`${totalUsers}\`\nChannels: \`${totalChannels}\``, true)
      .addField(
        'Node',
        `CPU: \`${cpuLoad.toFixed(2)}%\`\nMemory: \`${usedMem}/${totalMem} GB\`\nUptime: \`${uptime}\``,
        true
      )
      .setFooter({ text: `PID: ${process.pid}` })
      .setTimestamp(Date.now());
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
