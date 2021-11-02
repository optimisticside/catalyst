// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { DEFAULT_COLOR } = require('../config.json');
const { warning, denial, log, prompt } = require('../util/formatter.js')('Log Handler');
const { MessageEmbed } = require('discord.js');
const Module = require('../structs/module.js');

module.exports = class Guild extends Module {
  async greetMember(member) {
    const enabled = await this.database.getGuild(member.guild.id, 'greeting');
    if (!enabled) return;

    const channelId = await this.database.getGuild(member.guild.id, 'greetingChannel');
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const message = await this.database.getGuild(member.guild.id, 'greetingMessage');
    if (!message) return;

    const formatted = message.replace('{user}', `${member.user.username}#${member.user.dicriminator}`)
      .replace('{guild}', member.guild.name);
    channel.send(formatted);
  }

  async goodbyeMember(member) {
    // TODO: There's too much duplicate code in
    // goodbyeMember & greetMember. Is there a better way?
    const enabled = await this.database.getGuild(member.guild.id, 'goodbye');
    if (!enabled) return;

    const channelId = await this.database.getGuild(member.guild.id, 'goodbyeChannel');
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const message = await this.database.getGuild(member.guild.id, 'goodbyeMessage');
    if (!message) return;

    const formatted = message.replace('{user}', `${member.user.username}#${member.user.dicriminator}`)
      .replace('{guild}', member.guild.name);
    channel.send(formatted);
  }

  async autoRole(member) {
    const enabled = await this.database.getGuild(member.guild.id, 'autoRole');
    if (!enabled) return;

    const roleId = await this.database.getGuild(member.guild.id, 'autoRoleRole');
    const role = member.guild.roles.cache.get(roleId);
    if (!role) return;

    await member.roles.add(role);
  }

  async onMemberAdd(member) {
    await this.greetMember(member);
    await this.autoRole(member);
  }

  async onMemberRemove(member) {
    await this.goodbyeMember(member);
  }

  load({ eventHandler, database }) {
    this.database = database;
    eventHandler.on('guildMemberAdd', this.onMemberAdd.bind(this));
    eventHandler.on('guildMemberRemove', this.onMemberRemove.bind(this));
  }

  constructor(client) {
    super({
      name: 'logHandler',
      client: client
    });
  }
};