# Case Study - Echo Command
Lets take a look at the `echo` command. This is a great command to analyze because of how simple it is and how it utilizes OptionParsers to parse arguments. It also shows us how options can be used to provide a more fluid experience when developing commands. It's also a bit more interesting than the `ping` command, which we've all seen many times.

```js
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
```

This may look daunting at first, but let's break this down piece by piece.

# Improrts
When you look at the top of the file, you will see come `require` calls. These import modules that will help us create our command. 
```js
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
```
The first line is importing the base class for commands. This allows you to easily declare command properties, and handles defaults.
The second line is importing the `OptionParser` class. This allows you to parse commands, and provides an abstraction layer between chat and slash commands. Using this, however, is completely optional. This is why it is not done automatically by the system.

# Run function
If you look inside the `EchoCommand` class, you will see an asynchronous function called `run`. This is the function that is called to execute the command. It is provided with a few arguments, which include the bot's client, the given information, and the arguments.
```js
async run(client, given, args) {
  const parser = new OptionParser(this, given, args);
  given.reply(await parser.getOption('message'));
}
```
The first line of the function creates a new option parser, which will help us by parsing what we are given into types we can understand.
The next line of the function calls the `getOption` function, which retrieves what the user has provided for one of our options (we'll talk about options later on). Awaiting for the function will give us a string. We will reply to what we are given with what is provided for the `message` argument.