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
  dirty: boolean;
  needed: number;
  xp: number;
}

export default class LevelModule extends Module {
  dataCache = new Map<string, Map<string, MemberData>>();

  calcNeededDelta(level: number) {
    return 5 * Math.pow(level, 2) + 50 * level + 100;
  }

  calcLevel(xp: number) {
    let level = 0;
    while (xp >= this.calcNeededDelta(level)) {
      xp -= this.calcNeededDelta(level);
      level++;
    }
    return level;
  }

  calcNeeded(level: number) {
    let xp = 0;
    do {
      xp += this.calcNeededDelta(level);
    } while (--level);
    return xp;
  }

  async getLevelData(userId: string, guildId: string) {
    if (!this.dataCache.has(userId)) {
      const userLevels = new Map<string, MemberData>();
      const userData: UserDocument =
        (await UserData.findOne({ id: userId })) ?? (await UserData.create({ id: userId }));

      userData.xpData.forEach((xp, guildId) => {
        const level = this.calcLevel(xp);
        userLevels.set(guildId, {
          lastUpdate: 0,
          needed: this.calcNeeded(level + 1),
          dirty: false,
          level,
          xp
        });
      });

      this.dataCache.set(userId, userLevels);
    }

    const userLevels = this.dataCache.get(userId);
    if (!userLevels) return; // Make typescript happy.

    if (!userLevels.has(guildId)) {
      userLevels.set(guildId, {
        lastUpdate: 0,
        needed: this.calcNeeded(1),
        dirty: false,
        level: 0,
        xp: 0
      });
    }

    return userLevels.get(guildId);
  }

  async handleMessage(message: Message) {
    if (message.author.bot ?? !message.guild) return;

    const levelData = await this.getLevelData(message.author.id, message.guild.id);
    if (!levelData) return;

    if (Date.now() - levelData.lastUpdate < 60_000) return;
    levelData.xp += (Math.abs(await randomNumber()) + 50) % 100;
    levelData.dirty = true;
    levelData.lastUpdate = Date.now();

    if (levelData.xp < levelData.needed) return;
    levelData.needed = this.calcNeeded(levelData.level++);

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
    this.dataCache.forEach(async (userLevels, userId) => {
      const xpData = new Map<string, number>();
      userLevels.forEach((levelData, guildId) => {
        if (!levelData.dirty) return;
        levelData.dirty = false;
        xpData.set(guildId, levelData.xp);
      });

      if (!Object.entries(xpData).length) return;
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
