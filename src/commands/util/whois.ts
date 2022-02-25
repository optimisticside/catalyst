// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import CatalystClient from 'core/client';
import { ColorResolvable, GuildMember, MessageEmbed } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import OptionParser from 'utils/optionParser';
import moment from 'moment';
import config from 'core/config';

const PERMISSION_KEYWORDS = ['MANAGE', 'ADMINISTRATOR', 'KICK', 'BAN', 'MENTION'];
const { DEFAULT_COLOR } = config;

function constantToReadable(string: string) {
  return string
    .replaceAll('_', ' ')
    .replace(/\w\S*/g, m => m.charAt(0).toUpperCase() + m.substring(1).toLowerCase());
}

export default class WhoisCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const target = parser.getOption('user') as GuildMember;

    const joinedAt = target.joinedTimestamp
      ? moment(target.joinedTimestamp).format('MMMM Do YYYY, h:mm:ss a')
      : 'unknown';

    const keyPermissions = target.permissions
      .toArray()
      .filter(p => !given.guild?.roles.everyone.permissions.has(p))
      .filter(p => !!PERMISSION_KEYWORDS.find(kw => p.includes(kw)))
      .map(p => constantToReadable(p));

    const roles = target.roles.cache
      .filter(r => r !== given.guild?.roles.everyone)
      .sort((a, b) => a.position - b.position)
      .map(r => `<@&${r.id}>`)

    const embed = new MessageEmbed()
      .setAuthor({ name: target.user.username, iconURL: target.user.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setThumbnail(target.user.displayAvatarURL())
      .setDescription(`<@${target.user.id}>`)
      .addField('Joined', joinedAt, true)
      .addField('Registered', moment(target.user.createdTimestamp).format('MMMM Do YYYY, h:mm:ss a'), true)
      .addField(`Roles[${target.roles.cache.size}]`, roles.join(', '))
      .addField('Key Permissions', keyPermissions.join(' '))
      .setFooter({ text: `ID: ${target.user.id}` })
      .setTimestamp(Date.now());

    given.reply({ embeds: [embed] });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'whois',
      aliases: ['userInfo'],
      desc: 'Gets information about a user.',
      hidden: true, // TODO: Fix this command
      options: [
        {
          name: 'user',
          type: 'member',
          desc: 'The user to get information about',
          prompt: 'Who do you want to know about?',
          required: true
        }
      ]
    });
  }
}
