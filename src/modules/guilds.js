// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Module = require('../structs/module.js');
const GuildConfig = require('../models/guildConfig.js');

module.exports = class Guilds extends Module {
  async greetMember(member, config) {
    if (member.partial) member = await member.fetch();
    if (!config.greetingEnabled) return;

    const channel = member.guild.channels.cache.get(config.greetingChannel);
    if (!channel || !config.greetingMessage) return;

    const formatted = config.greetingMessage.replace('{mention}', `<@${member.user.id}>`) 
      .replaceAll('{user}', member.username)
      .replaceAll('{guild}', member.guild.name)
      .replaceAll('{count}', member.guild.memberCount);
    channel.send(formatted);
  }

  async goodbyeMember(member, config) {
    const user = await this.client.users.fetch(member.id);
    const guild = await this.client.guilds.fetch(member.guild.id);
    if (!config.goodbyeEnabled) return;

    const channel = guild.channels.cache.get(config.goodbyeChannel);
    if (!channel || !config.goodbyeMessage) return;
    
    const formatted = config.goodbyeMessage.replace('{user}', user.username)
      .replaceAll('{guild}', guild.name)
      .replaceAll('{count}', guild.memberCount);
    channel.send(formatted);
  }

  async joinDmMember(member, config) {
    if (!config.joinDmEnabled || !config.joinDmMessage) return;
    const formatted = config.joinDmMessage.replace('{mention}', `<@${member.user.id}>`) 
      .replaceAll('{user}', member.user.username)
      .replaceAll('{guild}', member.guild.name)
      .replaceAll('{count}', member.guild.memberCount);

    // TODO: Handle errors when creating a DM channel.
    // It can force the shard to restart.
    const dmChannel = await member.createDM();
    if (!dmChannel) return;
    dmChannel.send(formatted);
  }

  async autoRole(member, config) {
    if (!config.autoRoleEnabled || !config.autoRoles) return;
    const roles = config.autoRoles.map(r => member.guild.roles.cache.get(r));
    await Promise.all(roles.map(r => member.roles.add(r)));
  }

  async onMemberAdd(member) {
    const config = await GuildConfig.findOne({ id: member.guild.id })
      ?? await GuildConfig.create({ id: member.guild.id });
    await this.greetMember(member, config);
    await this.joinDmMember(member, config);
    await this.autoRole(member, config);
  }

  async onMemberRemove(member) {
    const config = await GuildConfig.findOne({ id: member.guild.id })
      ?? await GuildConfig.create({ id: member.guild.id });
    await this.goodbyeMember(member, config);
  }

  /*async onReactionAdd(reaction, user) {
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

    await member.roles.add(role, 'Added through Reaction Roles.').then(async () => {
      const dmChannel = await user.createDM();
      dmChannel.send(`You now have the ${role.name} role in ${guild.name}.`);
    });
  }

  async onReactionRemove(reaction, user) {
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
  }*/

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