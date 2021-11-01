// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { DEFAULT_COLOR } = require('../config.json');
const { warning, denial, log, prompt } = require('../util/formatter.js')('Log Handler');
const { MessageEmbed } = require('discord.js');
const Module = require('../structs/module.js');

module.exports = class Logs extends Module {
  async onMessageDelete(message) {
    if (!message.guild) return;
    if (newMessage.author.bot) return;
    if (await this.database.getGuild(message.guild.id, 'logs')) return;
    const logMessages = await this.database.getGuild(message.guild.id, 'logMessage');
    if (!logMessages) return;
    const logChannelId = await this.database.getGuild(message.guild.id, 'logChannel');
    const channel = message.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const title = `Message sent by <@${message.author.id}> deleted in <#${message.channel.id}>`;
    const username = `${user.username}#${user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, message.author.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`**${title}**\n${message.content}`)
      .setFooter(`ID: ${message.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onMessageEdit(oldMessage, newMessage) {
    if (!newMessage.guild) return;
    if (newMessage.author.bot) return;
    if (await this.database.getGuild(newMessage.guild.id, 'logs')) return;
    const logMessages = await this.database.getGuild(newMessage.guild.id, 'logMessage');
    if (!logMessages) return;
    const logChannelId = await this.database.getGuild(newMessage.guild.id, 'logChannel');
    const channel = newMessage.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const url = `https://discordapp.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id}`;
    const title = `Message sent by <@${newMessage.author.id}> edited in <#${newMessage.channel.id}> [Jump to message](${url})`;
    const username = `${newMessage.author.username}#${newMessage.author.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, newMessage.author.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setDescription(`**${title}**\n${newMessage.content}`)
      .addField('Before', oldMessage.content)
      .addField('After', newMessage.content)
      .setFooter(`ID: ${newMessage.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onJoin(member) {
    if (!member.guild) return;
    if (member.user.bot) return;
    if (await this.database.getGuild(member.guild.id, 'logs')) return;
    const logMessages = await this.database.getGuild(newMessage.guild.id, 'logMessage');
    if (!logMessages) return;
    const logChannelId = await this.database.getGuild(newMessage.guild.id, 'logChannel');
    const channel = member.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const title = `<@${member.author.id}> joined the server`;
    const username = `${member.user.username}#${member.user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, member.user.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setTitle(title)
      .setFooter(`ID: ${member.user.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onLeave(member) {
    if (!member.guild) return;
    if (member.user.bot) return;
    if (await this.database.getGuild(member.guild.id, 'logs')) return;
    const logMessages = await this.database.getGuild(member.guild.id, 'logMessage');
    if (!logMessages) return;
    const logChannelId = await this.database.getGuild(member.guild.id, 'logChannel');
    const channel = member.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const title = `<@${member.author.id}> left the server`;
    const username = `${member.user.username}#${member.user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, member.user.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setTitle(tiele)
      .setFooter(`ID: ${member.user.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  load({ commandHandler, eventHandler, slashHandler, database }) {
    this.database = database;
    eventHandler.on('messageDelete', this.onMessageDelete.bind(this));
    eventHandler.on('messageUpdate', this.onMessageEdit.bind(this));
    eventHandler.on('guildMemberAdd', this.onJoin.bind(this));
    eventHandler.on('guildMemberRemove', this.onLeave.bind(this));
    //commandHandler.on('commandRun', this.onCommand.bind(this));
    //slashHandler.on('commandRun', this.onSlashCommand.bind(this));
  }

  constructor(client) {
    super({
      name: 'logHandler',
      client: client
    });
  }
};