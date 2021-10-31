// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { PREFIX, CREATOR } = require('../config.json');
const { warning, denial, log, prompt } = require('../util/formatter.js')('Guardian');
const { Collection, Permissions } = require('discord.js');
const Module = require('../structs/module.js');

module.exports = class Guardian extends Module {
  async notify(message, reason) {
    const messages = {
      duplicate: 'Your message had too many duplicate phrases.',
      zalgo: 'Zalgo is not allowed.',
      invite: 'Invites are not allowed.',
      link: 'Links are not allowed.',
      image: 'Your message had too many images.',
      blacklist: 'Your message had a blacklisted word.',
      ip: 'Your message contained an IP address.',
      spam: 'You are sending messages too quickly.'
    }

    await message.reply(warning(messages[reason] ?? 'Your message(s) were blocked.'));
  }

  async delete(message, reason) {
    await this.notify(message, reason);
    await message.delete();
  }

  async handleMessage(message) {
    if (!message.guild) return;
    const enabled = await this.database.getGuild(message.guild.id, 'guardian');
    if (!enabled) return;

    const content = message.content;
    const config = {
      whitelist: JSON.parse(await this.database.getGuild(message.guild.id, 'guardianWhitelist')) || [],
      blacklistedWords: JSON.parse(await this.database.getGuild(message.guild.id, 'blacklistedWords')) || [],
      antiSpam: JSON.parse(await this.database.getGuild(message.guild.id, 'antiSpam')),
      spamLimit: 5,
      imageLimit: JSON.parse(await this.database.getGuild(message.guild.id, 'imageLimit')),
      blockZalgo: JSON.parse(await this.database.getGuild(message.guild.id, 'blockZalgo')),
      blockLinks: JSON.parse(await this.database.getGuild(message.guild.id, 'blockLinks')),
      blockInvites: JSON.parse(await this.database.getGuild(message.guild.id, 'blockInvites')),
      blockIps: JSON.parse(await this.database.getGuild(message.guild.id, 'blockIps'))
    };

    const images = message.attachments.filter(a => a.type === 'image');
    const hasDuplicates = (/^(.+)(?: +\1){3}/).test(content);
    const hasZalgo = (/%CC%/g).test(encodeURIComponent(content));
    const hasInvite = content.includes('discord.gg/' || 'discordapp.com/invite/');
    const hasLink = (/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/).test(content);
    const hasIp = (/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/).test(content);
    const isBlacklisted = config.blacklistedWords?.find(w => content.includes(w));

    const messages = await message.channel.messages?.fetch({ limit: 10 }) ?? new Collection();
    const recentMessages = messages.filter(m => m.author.id === message.author.id && message.createdAt - m.createdAt <= 5000);

    //if (message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
    if (config.whitelist?.find(id => message.author.id === id)) return;
    if (config.ignoredChannels?.find(c => message.channel.name === c)) return;
  
    // recentMessages is a Collection, so `size` is used instead of `length`
    if (config.antiSpam && config.spamLimit && recentMessages.size > config.spamLimit) {
      await this.notify(message, 'spam');
      recentMessages.map(m => m.delete());
    }
  
    if (config.blockDuplicates && hasDuplicates) await this.delete(message, 'duplicate');
    if (config.blockZalgo && hasZalgo) await this.delete(message, 'zalgo');
    if (config.blockInvites && hasInvite) await this.delete(message, 'invite');
    if (config.blockLinks && hasLink) await this.delete(message, 'link');
    if (config.blockIps && hasIp) await this.delete(message, 'ip');
    if (config.imageLimit && images.length < config.imageLimit) await this.delete(message, 'image');
    if (isBlacklisted) await this.delete(message, 'blacklist');
  }

  load({ eventHandler, database }) {
    this.database = database;
    eventHandler.on('messageCreate', this.handleMessage.bind(this));
  }
  
  constructor(client) {
    super({
      name: 'guardian',
      client: client
    });
  }
};