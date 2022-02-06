// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import CatalystClient from 'core/client';
import { ColorResolvable, GuildMember, MessageEmbed } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import OptionParser from 'utils/optionParser';
import Serializer from 'utils/serializer';
import config from 'core/config';

const PERMISSION_KEYWORDS = ['MANAGE', 'ADMINISTRATOR', 'KICK', 'BAN'];
const { DEFAULT_COLOR } = config;

export default class WhoisCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const target = parser.getOption('user') as GuildMember;

    const joinedAt = target.joinedTimestamp ? Serializer.serializeTimestamp(target.joinedTimestamp, 'f') : 'unknown';
    const keyPermissions = target.permissions
      .toArray()
      .filter(p => !given.guild?.roles.everyone.permissions.has(p))
      .filter(p => !!PERMISSION_KEYWORDS.find(kw => p.includes(kw)));

    const roles = target.roles.cache
      .filter(r => r !== given.guild?.roles.everyone)
      .sort((a, b) => a.position - b.position)
      .map(r => Serializer.serializeRole(r.id))
      .map(r => r.replace(/\w\S*/g, m => m.charAt(0).toUpperCase() + m.substring(1).toLowerCase()));

    const embed = new MessageEmbed()
      .setAuthor({ name: target.user.username, iconURL: target.user.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setThumbnail(target.user.displayAvatarURL())
      .setDescription(`<@${target.user.id}>`)
      .addField('Joined', joinedAt, true)
      .addField('Registered', Serializer.serializeTimestamp(target.user.createdTimestamp, 'f'), true)
      .addField(`Roles[${target.roles.cache.size}]`, roles.join(' '))
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
