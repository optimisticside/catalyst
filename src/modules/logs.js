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
    if (message.author.bot) return;
    if (await this.database.getGuild(message.guild.id, 'logs')) return;
    const logMessages = await this.database.getGuild(message.guild.id, 'logDelete');
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
    const logMessages = await this.database.getGuild(newMessage.guild.id, 'logEdit');
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

  async onGuildMemberAdd(member) {
    console.log('whyyyyyyyy')
    if (!member.guild) return;
    if (member.user.bot) return;
    if (await this.database.getGuild(member.guild.id, 'logs')) return;
    const logMessages = await this.database.getGuild(message.guild.id, 'logJoin');
    if (!logMessages) return;
    const logChannelId = await this.database.getGuild(message.guild.id, 'logChannel');
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

  async onGuildMemberRemove(member) {
    console.log('smh')
    if (!member.guild) return;
    if (member.user.bot) return;
    if (await this.database.getGuild(member.guild.id, 'logs')) return;
    const logMessages = await this.database.getGuild(member.guild.id, 'logLeave');
    if (!logMessages) return;
    const logChannelId = await this.database.getGuild(member.guild.id, 'logChannel');
    const channel = member.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const title = `<@${member.author.id}> left the server`;
    const username = `${member.user.username}#${member.user.discriminator}`;
    const embed = new MessageEmbed()
      .setAuthor(username, member.user.displayAvatarURL())
      .setColor(DEFAULT_COLOR)
      .setTitle(title)
      .setFooter(`ID: ${member.user.id}`)
      .setTimestamp(Date.now());
    channel.send({ embeds: [ embed ] });
  }

  async onGuildMemberUpdate(oldMember, newMember) {
    if (!newMember.guild) return;
    if (newMember.user.bot) return;
    if (await this.database.getGuild(newMember.guild.id, 'logs')) return;
    const logMessages = await this.database.getGuild(newMember.guild.id, 'logUpdate');
    if (!logMessages) return;
    const logChannelId = await this.database.getGuild(member.guild.id, 'logMemberUpdate');
    const channel = member.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    // TODO: Do this later...
  }

  load({ commandHandler, eventHandler, slashHandler, database }) {
    this.database = database;
    eventHandler.on('messageDelete', this.onMessageDelete.bind(this));
    eventHandler.on('messageUpdate', this.onMessageEdit.bind(this));
    eventHandler.on('guildMemberAdd', this.onGuildMemberAdd.bind(this));
    eventHandler.on('guildMemberRemove', this.onGuildMemberRemove.bind(this));
    eventHandler.on('guidMemberUpdate', this.onGuildMemberUpdate.bind(this));
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