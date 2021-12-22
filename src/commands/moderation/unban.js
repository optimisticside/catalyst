// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Ban Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class BanCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const id = await parser.getOption('target');

    given.guild.bans.remove(id, `Unbanned by ${given.author.id}`)
      .then(() => {
        given.reply(success(`Successfully unbanned user`));
      })
      .catch(err => {
        given.reply(alert(`Unable to ban user`));
        console.log(`Unable to unban ${id}: ${err}`);
      });
  }

  constructor() {
    super({
      name: 'unban',
      desc: 'Unbans the provided user.',
      perms: [ Permissions.FLAGS.BAN_MEMBERS ],
      tags: [ 'moderation' ],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'target',
          type: 'string',
          desc: 'The ID of the user to ban.',
          prompt: 'What is the ID of the user to unban?',
          required: true
        }
      ]
    });
  }
};