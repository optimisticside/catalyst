// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Module = require('../structs/module.js');

module.exports = class Guilds extends Module {
  async greetMember(member) {
    if (member.partial) member = await member.fetch();
    const enabled = JSON.parse(await this.database.getGuild(member.guild.id, 'greetingEnabled'));
    if (!enabled) return;

    const channelId = await this.database.getGuild(member.guild.id, 'greetingChannel');
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const message = await this.database.getGuild(member.guild.id, 'greetingMessage');
    if (!message) return;

    const formatted = message.replace('{user}', `<@${member.user.id}>`) 
      .replace('{guild}', member.guild.name)
      .replace('{count}', member.guild.memberCount);
    channel.send(formatted);
  }

  async goodbyeMember(member) {
    const user = await this.client.users.fetch(member.id);
    const guild = await this.client.guilds.fetch(member.guild.id);
    const enabled = JSON.parse(await this.database.getGuild(guild.id, 'goodbyeEnabled'));
    if (!enabled) return;

    const channelId = await this.database.getGuild(guild.id, 'goodbyeChannel');
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const message = await this.database.getGuild(guild.id, 'goodbyeMessage');
    if (!message) return;

    const formatted = message.replace('{user}', user.username)
      .replace('{guild}', guild.name)
      .replace('{count}', guild.memberCount);
    channel.send(formatted);
  }

  async autoRole(member) {
    const enabled = await this.database.getGuild(member.guild.id, 'autoRoleEnabled');
    if (!enabled) return;

    const roleIds = JSON.parse(await this.database.getGuild(member.guild.id, 'autoRoles')) ?? [];
    const roles = roleIds.map(r => member.guild.roles.cache.get(r));
    await Promise.all(roles.map(r => member.roles.add(r)));
  }

  async onMemberAdd(member) {
    await this.greetMember(member);
    await this.autoRole(member);
  }

  async onMemberRemove(member) {
    await this.goodbyeMember(member);
  }

  async onReactionAdd(reaction, user) {
    const enabled = JSON.parse(await this.database.getGuild(reaction.message.guild.id, 'reactionRolesEnabled'));
    if (!enabled) return;
    const messageId = await this.database.getGuild(reaction.message.guild.id, 'ractionRolesMessage');
    if (!messageId || messageId !== reaction.message.id) return;

    const raw = await this.database.getGuild(reaction.message.guild.id, 'reactionRoles');
    const roles = JSON.parse(raw ?? '[]');
    const roleData = roles.find(r => r[1] === reaction.emoji);
    const role = message.guild.roles.cache.get(roleData[0]);
    if (!role) return;

    const member = reaction.message.guild.members.fetch(user.id);
    if (!member) return;
    if (member.roles.cache.find(r => r === role)) return;
    console.log('b')
    await member.roles.add(role, 'Added through Reaction Roles.').then(async () => {
      const dmChannel = await user.createDM();
      dmChannel.send(`You now have the ${role.name} role in ${guild.name}.`);
    });
  }

  async onReactionRemove(reaction, user) { console.log('a')
    const emoji = reaction.emoji;
    const message = this.client.messages.fetch(reaction.message.id);

    const enabled = JSON.parse(await this.database.getGuild(reaction.message.guild.id, 'reactionRolesEnabled'));
    if (!enabled) return;
    const messageId = await this.database.getGuild(reaction.message.guild.id, 'ractionRolesMessage');
    if (!messageId || messageId !== reaction.message.id) return;

    const raw = await this.database.getGuild(reaction.message.guild.id, 'reactionRoles');
    const roles = JSON.parse(raw ?? '[]');
    const roleData = roles.find(r => r[1] === emoji);
    const role = message.guild.roles.cache.get(roleData[0]);
    if (!role) return;

    const member = reaction.message.guild.members.fetch(user.id);
    if (!member) return;
    if (!member.roles.cache.find(r => r === role)) return;
  
    await member.roles.remove(role, 'Removed through Reaction Roles.').then(async () => {
      const dmChannel = await user.createDM();
      dmChannel.send(`You no longer have the ${role.name} role in ${guild.name}.`);
    });
  }

  load({ eventHandler, database }) {
    this.database = database;
    eventHandler.on('guildMemberAdd', this.onMemberAdd.bind(this));
    eventHandler.on('guildMemberRemove', this.onMemberRemove.bind(this));
    // eventHandler.on('messageReactionAdd', this.onReactionAdd.bind(this));
    // eventHandler.on('messageReactionRemove', this.onReactionRemove.bind(this));
  }

  constructor(client) {
    super({
      name: 'guildHandler',
      client: client
    });
  }
};