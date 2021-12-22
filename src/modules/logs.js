// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { DEFAULT_COLOR } = require('../util/configParser.js');
const { warning, denial, log, prompt } = require('../util/formatter.js')('Log Handler');
const { MessageEmbed } = require('discord.js');
const Module = require('../structs/module.js');
const GuildConfig = require('../models/guildConfig.js');
const Serializer = require('../util/serializer.js');

module.exports = class Logs extends Module {
  async getData(key, guild, config) {
    if (!guild || !config) return;
    if (!config.logsEnabled || !config[key]) return;

    const channel = guild.channels.cache.get(config.logChannel);
    return channel;
  }

  async onMessageDelete(message) {
    if (message.author.bot) return;
    const config = await GuildConfig.findOne({ id: message.guild.id })
      ?? await GuildConfig.create({ id: message.guild.id });
    const channel = await this.getData('logMessageDelete', message.guild, config);
    if (!channel) return;

    const username = `${message.author.username}#${message.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, message.author.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`Message sent by <@${message.author.id}> deleted in <#${message.channel.id}>\n${message.content}`)
      .setFooter(`ID: ${message.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ], files: message.attachments.map(a => a.url) });
  }

  async onMessageBulkDelete(messages) {
    const last = messages.last();
    if (!last) return;
    const config = await GuildConfig.findOne({ id: last.guild.id })
      ?? await GuildConfig.create({ id: last.guild.id });
    const channel = await this.getData('logMessageDelete', last.guild, config);
    if (!channel) return;

    const username = `${last.author.username}#${last.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, last.author.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`${messages.size} messages bulk-deleted in <#${last.channel.id}>`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onMessageEdit(oldMessage, newMessage) {
    if (newMessage.author.bot) return;
    const config = await GuildConfig.findOne({ id: newMessage.guild.id })
      ?? await GuildConfig.create({ id: newMessage.guild.id });
    const channel = await this.getData('logMessageEdit', newMessage.guild, config);
    if (!channel) return;

    // Yes, this sometimes happens.
    if (oldMessage.content === newMessage.content) return;

    const url = `https://discordapp.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id}`;
    const username = `${newMessage.author.username}#${newMessage.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, newMessage.author.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription( `Message sent by <@${newMessage.author.id}> edited in <#${newMessage.channel.id}> [Jump to message](${url})`)
      .addField('Before', oldMessage.content)
      .addField('After', newMessage.content)
      .setFooter(`ID: ${newMessage.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onGuildMemberAdd(member) {
    const config = await GuildConfig.findOne({ id: member.guild.id })
      ?? await GuildConfig.create({ id: member.guild.id });
    const channel = await this.getData('logMemberJoin', member.guild, config);
    if (!channel) return;

    const username = `${member.user.username}#${member.user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, member.user.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`<@${member.user.id}> joined the server`)
      .setFooter(`ID: ${member.user.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onGuildMemberRemove(member) {
    const user = await this.client.users.fetch(member.id);
    const guild = await this.client.guilds.fetch(member.guild.id);

    const config = await GuildConfig.findOne({ id: guild.id })
      ?? await GuildConfig.create({ id: guild.id });
    const channel = await this.getData('logMemberLeave', member.guild, config);
    if (!channel) return;

    const username = `${user.username}#${user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, user.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`<@${user.id}> left the server`)
      .setFooter(`ID: ${user.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onGuildMemberUpdate(oldMember, newMember) {
    const config = await GuildConfig.findOne({ id: newMember.guild.id })
      ?? await GuildConfig.create({ id: newMember.guild.id });
    const channel = await this.getData(newMember.guild, config);
    if (!channel) return;
    
    const username = `${newMember.user.username}#${newMember.user.discriminator}`;
    if (oldMember.nickname != newMember.nickname) {
      const embed = new MessageEmbed()
        .setAuthor(username, newMember.user.displayAvatarURL())
        .setColor(DEFAULT_COLOR)
        .setDescription(`<@${newMember.user.id}> nickname changed`)
        .addField('Before', oldMember.nickname ?? oldMember.user.username)
        .addField('After', newMember.nickname ?? newMember.user.username)
        .setFooter(`ID: ${newMember.user.id}`)
        .setTimestamp(Date.now());
      channel.send({ embeds: [ embed ] });
    }

    oldMember.roles.cache.forEach(role => {
      if (newMember.roles.cache.has(role.id)) return;
      const embed = new MessageEmbed()
        .setAuthor(username, newMember.user.displayAvatarURL())
        .setColor(DEFAULT_COLOR)
        .setDescription(`<@${newMember.user.id}> was removed from the \`${role.name}\` role`)
        .setFooter(`Author ID: ${newMember.user.id} | Role ID: ${role.id}`)
        .setTimestamp(Date.now());
      channel.send({ embeds: [ embed ] });
    });

    newMember.roles.cache.forEach(role => {
      if (oldMember.roles.cache.has(role.id)) return;
      const embed = new MessageEmbed()
        .setAuthor(username, newMember.user.displayAvatarURL())
        .setColor(DEFAULT_COLOR)
        .setDescription(`<@${newMember.user.id}> was given the \`${role.name}\` role`)
        .setFooter(`Author ID: ${newMember.user.id} | Role ID: ${role.id}`)
        .setTimestamp(Date.now());
      channel.send({ embeds: [ embed ] });
    });
  }

  async onCommandRun(message, command, args) {
    if (command.passive) return;
    if (command.tags?.find(t => t === 'fun')) return;
    if (message.author.bot) return;

    const config = await GuildConfig.findOne({ id: message.guild.id })
      ?? await GuildConfig.create({ id: message.guild.id });
    const channel = await this.getData('logCommmands', message.guild, config);
    if (!channel) return;

    const username = `${message.author.username}#${message.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, message.author.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`Used ${command.name} command in <#${message.channel.id}>\n${message.content}`)
      .setFooter(`Author ID: ${message.author.id} | Message ID: ${message.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onSlashCommandRun(interaction, command) {
    if (command.passive) return;
    if (command.tags?.find(t => t === 'fun')) return;
    if (!interaction.inGuild()) return;
    if (interaction.user.bot) return;

    // TODO: This could be simpler if the `Serializer`
    // library was better built.
    const deserialize = async (given, option) => {
      switch (option.type) {
        case 'text': case 'raw': case 'string': default:
          return given;
        case 'integer':
          return Serializer.serializeInt(given);
        case 'number':
          return Serializer.serializeFloat(given);
        case 'boolean':
          return Serializer.serializeBool(given);
        case 'user': case 'member':
          return Serializer.serializeUser(given);
        case 'channel':
          return Serializer.serializeChannel(given);
        case 'role':
          return Serializer.serializeRole(given);
        case 'mentionable':
          return Serializer.serializeMentionable(given);
      };
    }

    const config = await GuildConfig.findOne({ id: interaction.guild.id })
      ?? await GuildConfig.create({ id: interaction.guild.id });
    const channel = await this.getData('logCommands', interaction.guild, config);
    if (!channel) return;

    let message = `/${interaction.commandName}`;
    const subName = interaction.options.getSubcommand(false);
    const subGroupName = interaction.options.getSubcommandGroup(false);
    if (subGroupName) message = `${message} ${subGroupName}`;
    if (subName) message = `${message} ${subName}`;
    await Promise.all(command.options.map(async option => {
      const given = interaction.options.get(option.name);
      if (!given || !given.value) return;
      message = `${message} ${option.name}: ${await deserialize(given.value, option)}`
    }));

    const username = `${interaction.user.username}#${interaction.user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, interaction.user.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`Used ${command.name} slash command in <#${interaction.channel.id}>\n${message}`)
      .setFooter(`ID: ${interaction.user.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onGuardianDelete(message, reason) {
    const config = await GuildConfig.findOne({ id: message.guild.id })
      ?? await GuildConfig.create({ id: message.guild.id });
    const channel = await this.getData('logGuardian', message.guild, config);
    if (!channel) return;

    const username = `${message.author.username}#${message.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, message.author.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`Guardian deleted a message sent by <@${message.author.id}> in <#${message.channel.id}>`)
      .addField('Reason', reason)
      .setFooter(`ID: ${message.author.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  load({ commandHandler, eventHandler, slashHandler, guardian, database }) {
    this.database = database;
    eventHandler.on('messageDelete', this.onMessageDelete.bind(this));
    eventHandler.on('messageDeleteBulk', this.onMessageBulkDelete.bind(this));
    eventHandler.on('messageUpdate', this.onMessageEdit.bind(this));
    eventHandler.on('guildMemberAdd', this.onGuildMemberAdd.bind(this));
    eventHandler.on('guildMemberRemove', this.onGuildMemberRemove.bind(this));
    eventHandler.on('guildMemberUpdate', this.onGuildMemberUpdate.bind(this));
    commandHandler.on('commandRun', this.onCommandRun.bind(this));
    slashHandler.on('commandRun', this.onSlashCommandRun.bind(this));
    guardian.on('messageDelete', this.onGuardianDelete.bind(this));
  }

  constructor(client) {
    super({
      name: 'logHandler',
      client: client
    });
  }
};