
<div align="center">
<img src="https://cdn.discordapp.com/avatars/679060088002052118/ef61b0dcdbfb530accbedd5b343da8e5.png?size=256">
</div>

## About
Catalyst is a powerful Discord bot. It's built with a very modular structure for maintainability and extendibility. It is published under the `MIT` license, meaning you can do whatever on earth you'd want to. You can invite the bot [here](https://discord.com/oauth2/authorize?&client_id=679060088002052118&scope=bot%20applications.commands&permissions=2134207679)

## Usage
From above the hood, Catalyst is used just as any other Discord bot. You can give it commands via the chat. Each command message should begin with a *prefix*, which is used to distinguish commands from messages. The default prefix is `c!`, but this can be changed through the guild configuration. Following the prefix should be the command, along with any arguments to be passed to the command. For example, if I wanted to run the `ping` command, I would do:
```
c!ping
```
Additionally, passing arguments can be done by splitting them with spaces. Here's how I would get information about the `kick` command:
```
c!help kick
```

## Slash Commands
Catalyst offers full support for slash commands. These slash commands can be viewed by entering the `/` key in the Discord message box, and navigating to the Catalyst menu. From here, you can see a list of commands that can be run. For more information about slash commands, you can read [Discord's blog post](https://blog.discord.com/slash-commands-are-here-8db0a385d9e6).

## Guardian
Guardian is Catalyst's auto-moderation system, which ensures a safe and friendly environment to chat in. Guardian can be configured by using the `config` command and navigating to the `Guardian` menu. Some of Guardian's features include anti-spam, self-bot detection, and anti-advertising.

## Logs
Logs allow you to keep track of everything that happens in your Discord server. Different types of logs can be toggled, so only things that are important to you are logged. These logs include message-related logs, Guardian logs, command logs, and user-related logs. Logs can be configured in the `config` command by navigating to the `Logs` menu.

## Auto Message
Catalyst supports greetings and goodbye-messages for when users join and leave the server, as well as join DMs. You can choose your own greeting and goodbye-message and you are provided keywords that will be replaced with information such as `{user}`, which is replaced with the username of the person that leaves or joins the server. Greetings and goodbyes can be configured in the `config` command by navigating to the `Auto Message` menu.

## Auto Role
Roles can be assigned to users when the join the Discord server. Catalyst now supports adding multiple roles to Auto Role. Auto Role can be configured in the `config` command by navigating to the `Auto Role` menu.

## And More
Catalyst is constantly getting updates. Soon there will be support for reaction roles and a starboard.