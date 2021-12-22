// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class EchoCommand extends Command {
  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    given.reply(await parser.getOption('message'));
  }

  constructor() {
    super({
      name: 'echo',
      desc: 'Repeats whatever you tell it.',
      hidden: true,
      options: [
        {
          name: 'message',
          type: 'text',
          desc: 'What you want to say',
          prompt: 'What do you want to say?',
          required: true
        }
      ]
    });
  }
};