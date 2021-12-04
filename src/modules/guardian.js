// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { PREFIX, CREATORS } = require('../util/configParser.js');
const { warning, denial, log, prompt } = require('../util/formatter.js')('Guardian');
const { Collection, Permissions } = require('discord.js');
const Module = require('../structs/module.js');
const GuildConfig = require('../models/guildConfig.js');
const wait = require('timers/promises').setTimeout;

module.exports = class Guardian extends Module {
  async notify(message, reason) {
    message.reply(warning(this.messages[reason] ?? 'Your message(s) were blocked.')).then(reply => {
      // We do not want to yield the `notify` function.
      wait(5000).then(() => reply.delete().catch(err => console.log(`${mhm}\n${err}`)));
    });
  }

  async delete(message, reason) {
    await this.notify(message, reason);
    this.emit('messageDelete', message, this.reasons[reason] ?? reason);
    // This causes the shard to restart so
    // we will do this >:)
    message.delete().catch(err => console.log(err));
  }

  async handleMessage(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const content = message.content;
    const config = await GuildConfig.findOne({ id: message.guild.id })
      ?? await GuildConfig.create({ id: message.guild.id });
    if (!config.guardianEnabled) return;
    /*
    const config = {
      whitelist: JSON.parse(await this.database.getGuild(message.guild.id, 'guardianWhitelist')) || [],
      blacklistedWords: JSON.parse(await this.database.getGuild(message.guild.id, 'blacklistedWords')) || [],
      antiSpam: JSON.parse(await this.database.getGuild(message.guild.id, 'antiSpam')),
      imageLimit: JSON.parse(await this.database.getGuild(message.guild.id, 'imageLimit')),
      blockZalgo: JSON.parse(await this.database.getGuild(message.guild.id, 'blockZalgo')),
      blockLinks: JSON.parse(await this.database.getGuild(message.guild.id, 'blockLinks')),
      blockInvites: JSON.parse(await this.database.getGuild(message.guild.id, 'blockInvites')),
      blockIps: JSON.parse(await this.database.getGuild(message.guild.id, 'blockIps')),
      blockSelfBots: JSON.parse(await this.database.getGuild(message.guild.id, 'blockSelfBots')),
    };
    */

    // Anti spam pressure values.
    // For now, they are not changable by users.
    // TODO: Create a new table for this.
    const antiSpam = {};
    antiSpam.pressureDecay = 2.5;
    antiSpam.basePressure = 10;
    antiSpam.maxPressure = 60;
    antiSpam.pressureRange = antiSpam.maxPressure - antiSpam.basePressure;
    antiSpam.imagePressure = antiSpam.pressureRange / 6;
    antiSpam.lengthPressure = antiSpam.pressureRange / 8000;
    antiSpam.linePressure = antiSpam.pressureRange / 70;
    antiSpam.pingPressure = antiSpam.pressureRange / 20;
    antiSpam.notifyInterval = 7500;

    const images = message.attachments.filter(a => a.type === 'image');
    const hasDuplicates = (/^(.+)(?: +\1){3}/).test(content);
    const hasZalgo = (/%CC%/g).test(encodeURIComponent(content));
    const hasInvite = content.includes('discord.gg/') || content.includes('discordapp.com/invite/');
    const hasLink = (/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/).test(content);
    const hasIp = (/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/).test(content);
    const hasEmbeds = message.embeds.length > 0;
    const isBlacklisted = config.blacklistedWords?.find(w => content.includes(w));

    //if (message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
    if (config.whitelist?.find(id => message.author.id === id)) return;
    if (config.ignoredChannels?.find(c => message.channel.name === c)) return;

    if (config.antiSpamEnabled) {
      if (this.messageTrackers.has(message.author.id)) {
        const tracker = this.messageTrackers.get(message.author.id);
        const wasZero = tracker.pressure === 0;
        tracker.pressure -= (antiSpam.basePressure * (message.createdAt - tracker.last) / (antiSpam.pressureDecay * 1000));
        tracker.pressure = Math.max(tracker.pressure, 0)
         + antiSpam.basePressure
         + antiSpam.imagePressure * message.attachments.size
         + antiSpam.imagePressure * message.embeds.length
         + antiSpam.lengthPressure * content.length
         + antiSpam.linePressure * content.split(/\r\n|\r|\n/).length
         + antiSpam.pingPressure * [ ...content.matchAll(/<@!?&?(\d+)>/g) ].length;

        tracker.last = message.createdAt;
        if (tracker.pressure !== 0 && wasZero) {
          tracker.start = tracker.last;
        }
        if (tracker.pressure > antiSpam.maxPressure) {
          // Until I can come up with a better way of dealing with this.
          // (such as muting the user), we'll have to deal with this.
          if (!tracker.lastReply || message.createdAt - tracker.lastReply > antiSpam.notifyInterval) {
            tracker.lastReply = Date.now();
            await this.notify(message, 'spam');
          }
          message.channel.messages?.fetch({ limit: 20 }).then(messages => {
            messages.filter(m => m.author === message.author && message.createdAt > tracker.start)
              .map(m => m.delete().catch(err => console.log(err)));
          });
        }
      } else {
        this.messageTrackers.set(message.author.id, { last: message.createdAt, pressure: 0 });
      }
    }

    // TODO: Ban user instead of deleting when detecting self-bot.
    // if (config.filterSelfBots && hasEmbeds) await this.delete(message, 'selfBot');
    if (config.blockDuplicates && hasDuplicates) await this.delete(message, 'duplicate');
    if (config.filterZalgo && hasZalgo) await this.delete(message, 'zalgo');
    if (config.filterInvites && hasInvite) await this.delete(message, 'invite');
    if (config.filterLinks && hasLink) await this.delete(message, 'link');
    if (config.filterIps && hasIp) await this.delete(message, 'ip');
    //if (config.imageLimit && images.length < config.imageLimit) await this.delete(message, 'image');
    if (isBlacklisted) await this.delete(message, 'blacklist');
  }

  load({ eventHandler, database, logHandler }) {
    this.database = database;
    this.logHandler = logHandler;
    eventHandler.on('messageCreate', this.handleMessage.bind(this));
  }
  
  constructor(client) {
    super({
      name: 'guardian',
      client: client
    });

    this.messageTrackers = new Map();
    this.messages = {
      duplicate: 'Message had too many duplicate phrases.',
      zalgo: 'Zalgo is not allowed.',
      invite: 'Invites are not allowed.',
      link: 'Links are not allowed.',
      image: 'Your message had too many images.',
      blacklist: 'Your message had a blacklisted word.',
      ip: 'Your message contained an IP address.',
      spam: 'You are sending messages too quickly.',
      selfBot: 'Self-bots are not allowed on Discord.'
    };

    this.reasons = {
      duplicate: 'Message contained duplicate phrases.',
      zalgo: 'Message contained zalgo.',
      invite: 'Message included Discord invite.',
      link: 'Message included link.',
      image: 'Message included too many images.',
      blacklist: 'Message contained blacklisted word.',
      ip: 'Message contained IP address.',
      spam: 'Messages sent to quickly.',
      selfBot: 'Flagged as self-bot.'
    }
  }
};