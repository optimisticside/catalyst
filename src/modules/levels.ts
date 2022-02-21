// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import Module from 'structs/module';
import CatalystClient from 'core/client';
import GuildData, { GuildDocument } from 'models/guildData';
import UserData, { UserDocument } from 'models/userData';
import randomNumber from 'utils/random';
import { Message } from 'discord.js';
import EventsModule from '@modules/events';

export interface MemberData {
  level: number;
  lastUpdate: number;
  needed: number;
  xp: number;
}

export default class LevelModule extends Module {
  dataCache = new Map<string, Map<string, MemberData>>();

  calculateNeeded(level: number) {
    return 5 * Math.pow(level, 2) + 50 * level + 100;
  }

  calculateLevel(xp: number) {
    let level = 0;
    do {
      xp -= this.calculateNeeded(level);
      if (xp < 0) return level;
    } while (++level);
    return 0;
  }

  async handleMessage(message: Message) {
    if (message.author.bot ?? !message.guild) return;

    if (!this.dataCache.has(message.author.id)) {
      const userLevels = new Map<string, MemberData>();
      const userData: UserDocument =
        (await UserData.findOne({ id: message.author.id })) ?? (await UserData.create({ id: message.author.id }));

      console.log(userData);
      userData.xpData.forEach((xp, guildId) => {
        const level = this.calculateLevel(xp);
        userLevels.set(guildId, {
          lastUpdate: 0,
          needed: this.calculateNeeded(level + 1),
          level,
          xp
        });
      });

      this.dataCache.set(message.author.id, userLevels);
    }

    console.log(this.dataCache);
    const userLevels = this.dataCache.get(message.author.id);
    if (!userLevels) return; // Make typescript happy.

    if (!userLevels.has(message.guild.id)) {
      userLevels.set(message.guild.id, {
        lastUpdate: 0,
        needed: this.calculateNeeded(1),
        level: 0,
        xp: 0
      });
    }

    const levelData = userLevels.get(message.guild.id);
    if (!levelData) return; // Make typescript happy.

    //if (Date.now() - levelData.lastUpdate < 60_000) return;
    levelData.xp += (Math.abs(await randomNumber()) + 50) % 100;
    levelData.lastUpdate = Date.now();

    console.log(levelData);
    if (levelData.xp < levelData.needed) return;
    levelData.needed += this.calculateNeeded(levelData.level++);

    const guildData: GuildDocument =
      (await GuildData.findOne({ id: message.guild.id })) ?? (await GuildData.create({ id: message.guild.id }));
    if (!guildData.levelupMessageEnabled) return;

    const levelupMessage = guildData.levelupMessage
      .replaceAll('{mention}', `<@${message.author.id}>`)
      .replaceAll('{level}', levelData.level.toString())
      .replaceAll('{xp}', levelData.xp.toString());

    message.channel.send(levelupMessage);
  }

  async updateData() {
    this.dataCache.forEach(async (levelData, userId) => {
      const xpData = new Map<string, number>();
      levelData.forEach((levelData, guildId) => xpData.set(guildId, levelData.xp));
      console.log('UPDATE', userId, xpData);
      await UserData.findOneAndUpdate({ id: userId }, { xpData });
    });
  }

  load() {
    this.client.getModule<EventsModule>('eventHandler').on('messageCreate', this.handleMessage.bind(this));
    setInterval(this.updateData.bind(this), 30_000);
  }

  constructor(client: CatalystClient) {
    super({
      name: 'levelHandler',
      client: client
    });
  }
}
