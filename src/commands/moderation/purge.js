// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');
const { alert, success } = require('../../util/formatter.js')('Purge Command');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const sleep = require('util').promisify(setTimeout);

module.exports = class PurgeCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const amount = await parser.getOption('amount');

    given.channel.bulkDelete(amount, true).then(messages => {
      given.reply(success(`Successfully deleted ${messages.size} messages`));
    }).catch(err => {
      given.reply(alert(`Unable to delete messages.`));
      console.log(`Unable to kick user: ${err}`);
    });
  }

  constructor() {
    super({
      name: 'purge',
      desc: 'Deletes the given amount of messages.',
      perms: [ Permissions.FLAGS.MANAGE_MESSAGES ],
      tags: [ 'moderation' ],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'amount',
          type: 'integer',
          desc: 'The number of messages to delete.',
          prompt: 'How many messages should I delete?',
          required: true
        },
      ]
    })
  }
};