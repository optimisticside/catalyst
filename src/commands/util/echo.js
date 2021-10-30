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
      options: [
        {
          name: 'message',
          type: 'text',
          desc: 'What you want me to say',
          prompt: 'What do you want me to say?',
          required: true
        }
      ]
    })
  }
};