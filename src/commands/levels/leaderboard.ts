// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import CatalystClient from 'core/client';
import LevelModule, { LevelData } from '@modules/levels';
import * as Fluid from 'libs/fluid';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import PagedListComponent from '@components/pagedList';

export default class LeaderboardCommand extends Command {
  async run(given: CommandGiven, _args: CommandArgs) {
    if (!given.guild) return;

    const levelHandler = this.client.getModule<LevelModule>('levelHandler');
    const levelData = await Promise.all(
      given.guild.members.cache.map(async member => {
        if (!given.guild || member.user.bot) return;
        const data = await levelHandler.getLevelData(member.user.id, given.guild.id);
        return { member, data: (data ?? { xp: 0, level: 0 }) as LevelData };
      })
    );

    const leaderboard = [...levelData.values()]
      .filter(<T>(x: T | undefined): x is T => x !== undefined)
      .sort((a, b) => a.data.xp - b.data.xp)
      .map(({ member, data }, index) => [`${index + 1}. ${member.user.tag}`, `Level ${data.level} (${data.xp} xp)`])
      .reduce((o, [key, value]) => Object.assign(o, { [key]: [value] }), {});

    const list = new PagedListComponent({
      pageSize: 15,
      sections: leaderboard
    });

    Fluid.mount(list, given);
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'leaderboard',
      desc: 'Displays the leaderboard of the most messages sent.',
      tags: ['levels'],
      guildOnly: true
    });
  }
}
