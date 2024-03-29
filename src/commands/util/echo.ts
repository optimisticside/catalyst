// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import CatalystClient from 'core/client';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import OptionParser from 'utils/optionParser';

export default class EchoCommand extends Command {
  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    given.reply(parser.getOption('message') as string);
  }

  constructor(client: CatalystClient) {
    super({
      client,
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
}
