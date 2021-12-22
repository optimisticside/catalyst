// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { NAME, CLIENT_ID, TOPGG_TOKEN, DBL_TOKEN, DISCORDS_TOKEN } = require('../../util/configParser.js');
const { Permissions } = require('discord.js');
const Command = require('../../structs/command.js');
const Fluid = require('../../util/fluid.js');
const VoteMenu = require('../../components/voteMenu.js');


module.exports = class HelpCommand extends Command {
  async run(client, given, args) {
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