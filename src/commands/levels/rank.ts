// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { GuildMember } from 'discord.js';
import formatter from 'utils/formatter';
import OptionParser from 'utils/optionParser';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
import UserData, { UserDocument } from 'models/userData';
import LevelModule from '@modules/levels';
const { neutral, alert } = formatter('Rank Command');

export default class RankCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const member = parser.getOption('user') as GuildMember ?? given.member;
    const userData: UserDocument = (await UserData.findOne({ id: member.user.id })) ?? (await UserData.create({ id: member.user.id }))

    if (userData.xpData.has(member.guild.id)) {
      const levelHandler = this.client.getModule<LevelModule>('levelHandler');
      const levelData = await levelHandler.getLevelData(member.user.id, member.guild.id);
      if (!levelData) return;

      given.reply(neutral(`${member.user.tag} is at level **${levelData.level}**.`));
    } else {
      given.reply(alert(`${member.user.tag} has not sent any messages`));
    }
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'rank',
      desc: 'Displays the rank of the provided user.',
      tags: ['levels'],
      guildOnly: true,
      options: [
        {
          name: 'user',
          type: 'member',
          desc: 'The user to get the rank of.',
          prompt: 'Who do you want to see the rank of?',
          required: false
        },
      ]
    });
  }
}
