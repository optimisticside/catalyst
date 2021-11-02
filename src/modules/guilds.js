// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Module = require('../structs/module.js');

module.exports = class Guilds extends Module {
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
    const enabled = await this.database.getGuild(member.guild.id, 'goodbye'); console.log('1')
    if (!enabled) return;

    const channelId = await this.database.getGuild(member.guild.id, 'goodbyeChannel'); console.log('2')
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const message = await this.database.getGuild(member.guild.id, 'goodbyeMessage'); console.log('3')
    if (!message) return;

    const formatted = message.replace('{user}', `${member.user.username}#${member.user.dicriminator}`)
      .replace('{guild}', member.guild.name); console.log('4')
    channel.send(formatted); console.log('5')
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
    console.log('BRUH')
    await this.greetMember(member);
    await this.autoRole(member);
  }

  async onMemberRemove(member) {
    await this.goodbyeMember(member);
  }

  load({ eventHandler, database }) {
    console.log('bruh')
    this.database = database;
    eventHandler.on('guildMemberAdd', this.onMemberAdd.bind(this));
    eventHandler.on('guildMemberRemove', this.onMemberRemove.bind(this));
    console.log('mk')
  }

  constructor(client) {
    super({
      name: 'guildHandler',
      client: client
    });
  }
};