// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { Permissions } from 'discord.js';
import Command, { CommandGiven, CommandArgs } from 'structs/command';
import * as Fluid from 'libs/fluid';
import VoteMenu from '@components/voteMenu';
import CatalystClient from 'core/client';

const { NAME, CLIENT_ID, TOPGG_TOKEN, DBL_TOKEN, DISCORDS_TOKEN } = config;

export default class HelpCommand extends Command {
  async run(_client: CatalystClient, given: CommandGiven) {
    const voteMenu = new VoteMenu({
      clientId: CLIENT_ID,
      name: NAME,
      showTopgg: TOPGG_TOKEN !== undefined,
      showDbl: DBL_TOKEN !== undefined,
      showDiscords: DISCORDS_TOKEN !== undefined
      // TODO: Add Discord Labs
    });
    Fluid.mount(voteMenu, given, { time: 15_000 });
  }

  constructor() {
    super({
      name: 'vote',
      desc: 'Displays links where you can vote for the bot.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
    });
  }
};