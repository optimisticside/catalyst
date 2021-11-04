
<div align="center">
<img src="https://cdn.discordapp.com/avatars/679060088002052118/ef61b0dcdbfb530accbedd5b343da8e5.png?size=256">
</div>

## About
Catalyst is a powerful Discord bot. It's built in a very modular structure made maintainability and extendibility. It is published under the `MIT` license, meaning you can do whatever on earth you'd want to. You can invite the bot [here](https://discord.com/oauth2/authorize?&client_id=679060088002052118&scope=bot%20applications.commands&permissions=2134207679)

## Usage
From above the hood, Catalyst is used just as any other Discord bot. You can give it commands via the chat. Each command message should begin with a *prefix*, which is used to distinguish commands from messages. The default prefix is `c!`, but this can be changed through the guild configuration. Following the prefix should be the command, along with any arguments to be passed to the command. For example, if I wanted to run the `ping` command, I would do:
```
c!ping
```
Additionally, passing arguments can be done by splitting them with spaces. Here's how I would get information about the `kick` command:
```
c!help kick
```