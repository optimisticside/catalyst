// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import formatter from 'utils/formatter';
import { Message, Snowflake, TextChannel } from 'discord.js';
import Module from 'structs/module';
import GuildData, { GuildDocument } from 'models/guildData';
import { setTimeout as wait } from 'timers/promises';
import CatalystClient from 'core/client';

const { warning } = formatter('Guardian');

interface MessageTracker {
  start?: number;
  last: number;
  lastReply?: number;
  pressure: number;
}

interface AntispamConfig {
  pressureDecay: number;
  basePressure: number;
  maxPressure: number;
  pressureRange: number;
  toleranceEpsilon: number;
  lengthPressure: number;
  imagePressure: number;
  linePressure: number;
  pingPressure: number;
  notifyInterval: number;
}

export default class Guardian extends Module {
  messages: { [key: string]: string };
  reasons: { [key: string]: string };
  messageTrackers: Map<Snowflake, MessageTracker>;
  antispam: AntispamConfig;

  async notify(message: Message, reason: string) {
    await message
      .reply(warning(this.messages[reason] ?? 'Your message(s) were blocked.'))
      .then(reply => {
        // We do not want to yield the `notify` function.
        wait(5000).then(() => reply.delete().catch(console.error));
      });
  }

  async delete(message: Message, reason: string) {
    await this.notify(message, reason);
    this.emit('messageDelete', message, this.reasons[reason] ?? reason);
    // This causes the shard to restart so
    // we will do this >:)
    message.delete().catch(console.error);
  }

  async handleMessage(message: Message) {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!message.channel) return;

    const content = message.content;
    const channel = message.channel;
    const createdAt = message.createdTimestamp;
    const config: GuildDocument =
      (await GuildData.findOne({ id: message.guild.id })) ??
      (await GuildData.create({ id: message.guild.id }));
    if (!config.guardianEnabled || !(channel instanceof TextChannel)) return;

    // Anti spam pressure values.
    // For now, they are not changable by users.
    // TODO: Create a new table for this.

    //const images = message.attachments.filter(a => a.type === 'image');
    const hasDuplicates = /^(.+)(?: +\1){3}/.test(content);
    const hasZalgo = /%CC%/g.test(encodeURIComponent(content));
    const hasInvite = content.includes('discord.gg/') || content.includes('discordapp.com/invite/');
    const hasLink = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(
      content
    );
    const hasIp = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/.test(content);
    //const hasEmbeds = message.embeds.length > 0;
    const isBlacklisted = config.blacklistedWords?.find(w => content.includes(w));

    //if (message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
    if (config.guardianWhitelist?.find(id => message.author.id === id)) return;
    //if (config.ignoredChannels?.find(c => channel.name === c)) return;

    if (config.antiSpamEnabled) {
      const tracker = this.messageTrackers.get(message.author.id);
      if (tracker !== undefined) {
        const lastPressure = tracker.pressure;
        tracker.pressure -=
          (this.antispam.basePressure * (createdAt - tracker.last)) /
          (this.antispam.pressureDecay * 1000);
        tracker.pressure =
          Math.max(tracker.pressure, 0) +
          this.antispam.basePressure +
          this.antispam.imagePressure * message.attachments.size +
          this.antispam.imagePressure * message.embeds.length +
          this.antispam.lengthPressure * content.length +
          this.antispam.linePressure * content.split(/\r\n|\r|\n/).length +
          this.antispam.pingPressure * [...content.matchAll(/<@!?&?(\d+)>/g)].length;

        tracker.last = createdAt;
        const tolerance = this.antispam.basePressure + this.antispam.toleranceEpsilon;
        if (tracker.pressure > tolerance && lastPressure <= tolerance) {
          tracker.start = tracker.last;
        }
        if (tracker.pressure > this.antispam.maxPressure) {
          // Until I can come up with a better way of dealing with this.
          // (such as muting the user), we'll have to deal with this.
          if (!tracker.lastReply || createdAt - tracker.lastReply > this.antispam.notifyInterval) {
            tracker.lastReply = Date.now();
            await this.notify(message, 'spam');
          }

          message.channel.messages?.fetch({ limit: 20 }).then(messages => {
            if (tracker.start === undefined || !channel.bulkDelete) return;
            messages = messages.filter(
              m =>
                tracker.start !== undefined &&
                m.author === message.author &&
                m.createdTimestamp > tracker.start
            );
            //.map(m => m.delete().catch(console.error));
            channel
              .bulkDelete(messages)
              .then(() => this.emit('messageBulkDelete', messages, this.reasons.spam))
              .catch(console.error);
          });
        }
      } else {
        this.messageTrackers.set(message.author.id, {
          last: createdAt,
          pressure: 0
        });
      }
    }

    // TODO: Ban user instead of deleting when detecting self-bot.
    // if (config.filterSelfBots && hasEmbeds) await this.delete(message, 'selfBot');
    if (config.filterDuplicates && hasDuplicates) await this.delete(message, 'duplicate');
    if (config.filterZalgo && hasZalgo) await this.delete(message, 'zalgo');
    if (config.filterInvites && hasInvite) await this.delete(message, 'invite');
    if (config.filterLinks && hasLink) await this.delete(message, 'link');
    if (config.filterIps && hasIp) await this.delete(message, 'ip');
    //if (config.imageLimit && images.length < config.imageLimit) await this.delete(message, 'image');
    if (isBlacklisted) await this.delete(message, 'blacklist');
  }

  load({ eventHandler }) {
    eventHandler.on('messageCreate', this.handleMessage.bind(this));
  }

  constructor(client: CatalystClient) {
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
    };

    const basePressure = 10;
    const maxPressure = 60;
    const pressureRange = maxPressure - basePressure;
    this.antispam = {
      basePressure,
      maxPressure,
      pressureRange,
      pressureDecay: 2.5,
      notifyInterval: 7500,
      toleranceEpsilon: basePressure + pressureRange * 0.175,
      imagePressure: pressureRange / 6,
      lengthPressure: pressureRange / 8000,
      linePressure: pressureRange / 70,
      pingPressure: pressureRange / 20
    };
  }
}
