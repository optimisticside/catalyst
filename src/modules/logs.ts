// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import {
  ColorResolvable,
  CommandInteraction,
  Guild,
  Message,
  MessageEmbed,
  Collection,
  GuildMember,
  TextChannel,
  Snowflake
} from 'discord.js';
import Module from 'structs/module';
import GuildData, { GuildDocument } from 'models/guildData';
import Serializer, { Deserializable } from 'utils/serializer';
import Command, { CommandOption } from 'structs/command';
import CatalystClient from 'core/client';
import EventsModule from '@modules/events';
import SlashModule from '@modules/slash';
import GuardianModule from '@modules/guardian';
import CommandModule from '@modules/commands';

const { DEFAULT_COLOR } = config;

export default class LogsModules extends Module {
  async getData(key: string, guild: Guild, config: GuildDocument) {
    if (!guild || !config) return;
    if (!config.logsEnabled || !config[key]) return;

    const channel = guild.channels.cache.get(config.logChannel);
    return channel;
  }

  async onMessageDelete(message: Message) {
    if (message.author.bot || !message.guild) return;
    const config =
      (await GuildData.findOne({ id: message.guild.id })) ?? (await GuildData.create({ id: message.guild.id }));
    const channel = await this.getData('logMessageDelete', message.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    const username = `${message.author.username}#${message.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({ name: username, iconURL: message.author.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`Message sent by <@${message.author.id}> deleted in <#${message.channel.id}>\n${message.content}`)
      .setFooter({ text: `ID: ${message.id}` })
      .setTimestamp(Date.now());
    channel.send({
      embeds: [embed],
      files: message.attachments.map(a => a.url)
    });
  }

  async onMessageBulkDelete(messages: Collection<Snowflake, Message>) {
    const last = messages.last();
    if (!last || !last.guild) return;
    const config = (await GuildData.findOne({ id: last.guild.id })) ?? (await GuildData.create({ id: last.guild.id }));
    const channel = await this.getData('logMessageDelete', last.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    const username = `${last.author.username}#${last.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({ name: username, iconURL: last.author.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`${messages.size} messages bulk-deleted in <#${last.channel.id}>`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [embed] });
  }

  async onMessageEdit(oldMessage: Message, newMessage: Message) {
    if (newMessage.author.bot || !newMessage.guild) return;
    const config =
      (await GuildData.findOne({ id: newMessage.guild.id })) ?? (await GuildData.create({ id: newMessage.guild.id }));
    const channel = await this.getData('logMessageEdit', newMessage.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    // Yes, this sometimes happens.
    if (oldMessage.content === newMessage.content) return;

    const url = `https://discordapp.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id}`;
    const username = `${newMessage.author.username}#${newMessage.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({
        name: username,
        iconURL: newMessage.author.displayAvatarURL()
      })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(
        `Message sent by <@${newMessage.author.id}> edited in <#${newMessage.channel.id}> [Jump to message](${url})`
      )
      .addField('Before', oldMessage.content)
      .addField('After', newMessage.content)
      .setFooter({ text: `ID: ${newMessage.id}` })
      .setTimestamp(Date.now());
    channel.send({ embeds: [embed] });
  }

  async onGuildMemberAdd(member: GuildMember) {
    const config =
      (await GuildData.findOne({ id: member.guild.id })) ?? (await GuildData.create({ id: member.guild.id }));
    const channel = await this.getData('logMemberJoin', member.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    const username = `${member.user.username}#${member.user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({ name: username, iconURL: member.user.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`<@${member.user.id}> joined the server`)
      .setFooter({ text: `ID: ${member.user.id}` })
      .setTimestamp(Date.now());
    channel.send({ embeds: [embed] });
  }

  async onGuildMemberRemove(member: GuildMember) {
    const user = await this.client.users.fetch(member.id);
    const guild = await this.client.guilds.fetch(member.guild.id);

    const config = (await GuildData.findOne({ id: guild.id })) ?? (await GuildData.create({ id: guild.id }));
    const channel = await this.getData('logMemberLeave', member.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    const username = `${user.username}#${user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({ name: username, iconURL: user.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`<@${user.id}> left the server`)
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp(Date.now());
    channel.send({ embeds: [embed] });
  }

  async onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember) {
    const config =
      (await GuildData.findOne({ id: newMember.guild.id })) ?? (await GuildData.create({ id: newMember.guild.id }));
    const channel = await this.getData('logMemberUpdate', newMember.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    const username = `${newMember.user.username}#${newMember.user.discriminator}`;
    if (oldMember.nickname != newMember.nickname) {
      const embed = new MessageEmbed()
        .setAuthor({
          name: username,
          iconURL: newMember.user.displayAvatarURL()
        })
        .setColor(DEFAULT_COLOR as ColorResolvable)
        .setDescription(`<@${newMember.user.id}> nickname changed`)
        .addField('Before', oldMember.nickname ?? oldMember.user.username)
        .addField('After', newMember.nickname ?? newMember.user.username)
        .setFooter({ text: `ID: ${newMember.user.id}` })
        .setTimestamp(Date.now());
      channel.send({ embeds: [embed] });
    }

    oldMember.roles.cache.forEach(role => {
      if (newMember.roles.cache.has(role.id)) return;
      const embed = new MessageEmbed()
        .setAuthor({
          name: username,
          iconURL: newMember.user.displayAvatarURL()
        })
        .setColor(DEFAULT_COLOR as ColorResolvable)
        .setDescription(`<@${newMember.user.id}> was removed from the \`${role.name}\` role`)
        .setFooter({ text: `Author ID: ${newMember.user.id} | Role ID: ${role.id}` })
        .setTimestamp(Date.now());
      channel.send({ embeds: [embed] });
    });

    newMember.roles.cache.forEach(role => {
      if (oldMember.roles.cache.has(role.id)) return;
      const embed = new MessageEmbed()
        .setAuthor({
          name: username,
          iconURL: newMember.user.displayAvatarURL()
        })
        .setColor(DEFAULT_COLOR as ColorResolvable)
        .setDescription(`<@${newMember.user.id}> was given the \`${role.name}\` role`)
        .setFooter({ text: `Author ID: ${newMember.user.id} | Role ID: ${role.id}` })
        .setTimestamp(Date.now());
      channel.send({ embeds: [embed] });
    });
  }

  async onCommandRun(message: Message, command: Command) {
    if (command.passive) return;
    if (command.tags?.find(t => t === 'fun')) return;
    if (message.author.bot || !message.guild) return;

    const config =
      (await GuildData.findOne({ id: message.guild.id })) ?? (await GuildData.create({ id: message.guild.id }));
    const channel = await this.getData('logCommmands', message.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    const username = `${message.author.username}#${message.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({ name: username, iconURL: message.author.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`Used ${command.name} command in <#${message.channel.id}>\n${message.content}`)
      .setFooter({ text: `Author ID: ${message.author.id} | Message ID: ${message.id}` })
      .setTimestamp(Date.now());
    channel.send({ embeds: [embed] });
  }

  async onSlashCommandRun(interaction: CommandInteraction, command: Command) {
    if (command.passive) return;
    if (command.tags.find(t => t === 'fun')) return;
    if (!interaction.inGuild()) return;
    if (interaction.user.bot || !interaction.guild) return;

    // TODO: This could be simpler if the `Serializer`
    // library was better built.
    const deserialize = async (given: Deserializable, option: CommandOption) => {
      switch (option.type) {
        case 'text':
        case 'raw':
        case 'string':
        default:
          return given;
        case 'integer':
          return Serializer.serializeInt(given);
        case 'number':
          return Serializer.serializeFloat(given);
        //case 'boolean':
        //return Serializer.serializeBool(given);
        case 'user':
        case 'member':
          return Serializer.serializeUser(given);
        case 'channel':
          return Serializer.serializeChannel(given);
        case 'role':
          return Serializer.serializeRole(given);
        case 'mentionable':
          return Serializer.serializeMentionable(given);
      }
    };

    const config =
      (await GuildData.findOne({ id: interaction.guild.id })) ?? (await GuildData.create({ id: interaction.guild.id }));
    const channel = await this.getData('logCommands', interaction.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    let message = `/${interaction.commandName}`;
    const subName = interaction.options.getSubcommand(false);
    const subGroupName = interaction.options.getSubcommandGroup(false);
    if (subGroupName) message = `${message} ${subGroupName}`;
    if (subName) message = `${message} ${subName}`;
    await Promise.all(
      command.options.map(async option => {
        const given = interaction.options.get(option.name);
        if (!given || !given.value) return;
        message = `${message} ${option.name}: ${await deserialize(given.value, option)}`;
      })
    );

    const username = `${interaction.user.username}#${interaction.user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({
        name: username,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`Used ${command.name} slash command in <#${interaction.channel?.id}>\n${message}`)
      .setFooter({ text: `ID: ${interaction.user.id}` })
      .setTimestamp(Date.now());
    channel.send({ embeds: [embed] });
  }

  async onGuardianDelete(message: Message, reason: string) {
    if (!message.guild) return;
    const config =
      (await GuildData.findOne({ id: message.guild.id })) ?? (await GuildData.create({ id: message.guild.id }));
    const channel = await this.getData('logGuardian', message.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    const username = `${message.author.username}#${message.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({ name: username, iconURL: message.author.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`Guardian deleted a message sent by <@${message.author.id}> in <#${message.channel.id}>`)
      .addField('Reason', reason)
      .setFooter({ text: `ID: ${message.author.id}` })
      .setTimestamp(Date.now());
    channel.send({ embeds: [embed] });
  }

  async onGuardianBulkDelete(messages: Collection<Snowflake, Message>, reason: string) {
    const last = messages.last();
    if (!last || !last.guild) return;
    const config = (await GuildData.findOne({ id: last.guild.id })) ?? (await GuildData.create({ id: last.guild.id }));
    const channel = await this.getData('logGuardian', last.guild, config);
    if (!channel || !(channel instanceof TextChannel)) return;

    const username = `${last.author.username}#${last.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor({ name: username, iconURL: last.author.displayAvatarURL() })
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`Guardian bulk-deleted ${messages.size} sent by <@${last.author.id}> in <#${last.channel.id}>`)
      .addField('Reason', reason)
      .setFooter({ text: `ID: ${last.author.id}` })
      .setTimestamp(Date.now());
    channel.send({ embeds: [embed] });
  }

  load() {
    const commandHandler = this.client.getModule<CommandModule>('commandHandler');
    const eventHandler = this.client.getModule<EventsModule>('eventHandler');
    const slashHandler = this.client.getModule<SlashModule>('slashHandler');
    const guardian = this.client.getModule<GuardianModule>('guardian');

    eventHandler.on('messageDelete', this.onMessageDelete.bind(this));
    eventHandler.on('messageDeleteBulk', this.onMessageBulkDelete.bind(this));
    eventHandler.on('messageUpdate', this.onMessageEdit.bind(this));
    eventHandler.on('guildMemberAdd', this.onGuildMemberAdd.bind(this));
    eventHandler.on('guildMemberRemove', this.onGuildMemberRemove.bind(this));
    eventHandler.on('guildMemberUpdate', this.onGuildMemberUpdate.bind(this));
    commandHandler.on('commandRun', this.onCommandRun.bind(this));
    slashHandler.on('commandRun', this.onSlashCommandRun.bind(this));
    guardian.on('messageDelete', this.onGuardianDelete.bind(this));
    guardian.on('messageBulkDelete', this.onGuardianBulkDelete.bind(this));
  }

  constructor(client: CatalystClient) {
    super({
      name: 'logHandler',
      client: client
    });
  }
}
