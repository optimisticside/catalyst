// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { GuildMember, MessageActionRow, MessageButton, TextChannel } from 'discord.js';
import Module from 'structs/module';
import GuildData, { GuildDocument } from 'models/guildData';
import CatalystClient from 'core/client';
import EventModule from '@modules/events';

export default class GuildsModule extends Module {
  async greetMember(member: GuildMember, config: GuildDocument) {
    if (member.partial) member = await member.fetch();
    if (!config.greetingEnabled || !config.greetingChannel) return;

    const channel = member.guild.channels.cache.get(config.greetingChannel);
    if (!channel || !config.greetingMessage || !(channel instanceof TextChannel)) return;

    const formatted = config.greetingMessage
      .replace('{mention}', `<@${member.user.id}>`)
      .replaceAll('{user}', member.user.username)
      .replaceAll('{guild}', member.guild.name)
      .replaceAll('{count}', member.guild.memberCount.toString());
    channel.send(formatted);
  }

  async goodbyeMember(member: GuildMember, config: GuildDocument) {
    const user = await this.client.users.fetch(member.id);
    const guild = await this.client.guilds.fetch(member.guild.id);
    if (!config.goodbyeEnabled) return;

    const channel = guild.channels.cache.get(config.goodbyeChannel);
    if (!channel || !config.goodbyeMessage || !(channel instanceof TextChannel)) return;

    const formatted = config.goodbyeMessage
      .replace('{user}', user.username)
      .replaceAll('{guild}', guild.name)
      .replaceAll('{count}', guild.memberCount.toString());
    channel.send(formatted);
  }

  async joinDmMember(member: GuildMember, config: GuildDocument) {
    if (!config.joinDmEnabled || !config.joinDmMessage) return;
    const formatted = config.joinDmMessage
      .replace('{mention}', `<@${member.user.id}>`)
      .replaceAll('{user}', member.user.username)
      .replaceAll('{guild}', member.guild.name)
      .replaceAll('{count}', member.guild.memberCount.toString());

    // TODO: Handle errors when creating a DM channel.
    // It can force the shard to restart.
    const dmChannel = await member.createDM();
    if (!dmChannel) return;
    dmChannel.send({
      content: formatted,
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            label: `Sent from server: ${member.guild.name}`,
            style: 'SECONDARY',
            customId: '0',
            disabled: true
          })
        )
      ]
    });
  }

  async autoRole(member: GuildMember, config: GuildDocument) {
    if (!config.autoRoleEnabled || !config.autoRoles) return;
    const roles = config.autoRoles.map(r => member.guild.roles.cache.get(r));
    await Promise.all(roles.map(async r => r && (await member.roles.add(r))));
  }

  async onMemberAdd(member: GuildMember) {
    const config =
      (await GuildData.findOne({ id: member.guild.id })) ?? (await GuildData.create({ id: member.guild.id }));
    await this.greetMember(member, config);
    await this.joinDmMember(member, config);
    await this.autoRole(member, config);
  }

  async onMemberRemove(member: GuildMember) {
    const config =
      (await GuildData.findOne({ id: member.guild.id })) ?? (await GuildData.create({ id: member.guild.id }));
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

  load() {
    const eventHandler = this.client.getModule<EventModule>('eventHandler');
    eventHandler.on('guildMemberAdd', this.onMemberAdd.bind(this));
    eventHandler.on('guildMemberRemove', this.onMemberRemove.bind(this));
    // eventHandler.on('messageReactionAdd', this.onReactionAdd.bind(this));
    // eventHandler.on('messageReactionRemove', this.onReactionRemove.bind(this));
  }

  constructor(client: CatalystClient) {
    super({
      name: 'guildHandler',
      client: client
    });
  }
}
