Catalyst is a powerful Discord bot. It's built in a very modular structure made maintenability and extendability. It can also be used as a framework to create a bot.

## Getting Started
Catalyst can be used through slash commands or through chat commands. Chat commands must start with a prefix, which tells the bot that the user is sending a command. The default prefix is `c!`, meaning you could run the `help` command by doing `c!help`.

Additionally, you can provide arguments to the command. In case of the `help` command, you can type `c!help kick` to view information about the `kick` command. The format for providing arguments to commands is as follows: `c!command argument1 argument2 ...`.

Multiple commands can be executed, by using the statement terminator. The default statement terminator is `;`. The format for running statements is as follows: `c!statement1; statement2; ...`.
Here's an example of using all three syntax guidelines, that says `hi` and runs the ping command: `c!echo hi; ping`

## Slash Commands
Like most modern Discord bots, Catalyst has full support for slash commands. Slash commands can be accessed by typing the forward-slash key in the message box. This will open a menu of commands that can be run, by the different bots accessable in the channel.