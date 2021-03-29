
<div align="center">
<img src="https://cdn.discordapp.com/avatars/679060088002052118/ef61b0dcdbfb530accbedd5b343da8e5.png?size=256">
</div>

## About
Catalyst is a powerful Discord bot. It's built in a very modular structure made maintenability and extendability. It is published under the `Unlicense`, meaning you can do whatever on earth you'd want to.

## Usage
From above the hood, Catalyst is used just as any other Discord bot. You can give it commands via the chat. Each command message should begin with a *prefix*, which is used to distinguish commands from messages. The default prefix is `?`. Following the prefix should be the command, along with any arguments to be passed to the command. For example, if I wanted to test the bot's latency I would do:
```
?ping
```
Additionally, passing arguments can be done by splitting them with spaces. Here's how I would get information about the `kick` command:
```
?help kick
```

## Aliases
Commands have the ability to be called through aliases. These are alternative names, and often shortcuts to call the command. A notable example is the `commands` command, which displays a list of commands. It can be called through it's alias `cmds`.

## Cooldowns
Commands also have cooldowns. These are used to prevent spam of them. Each command can have a different cooldown manually set by the developer, or it can follow a default cooldown (by default, 2 seconds) which can also be set by the developer. If I tried to run the `meme` command (which gets a meme from Reddit, and diplays it in the chat) twice very fast, I'd get a warning telling me to slow down. 

## Installation
One major plus about Catalyst is that it's fully open-source. This means that anyone can take it and use it for themselves. The installation process is fairly simple, and should work provided you have [Node.js](https://nodejs.org) installed already.

You'll first want to download the repository. This can be done through the site or through `git install <repo-url>`. Next you have to install the packages, which can be done by running `npm install`.

You'll also want to set up your `.env` file. This stores private information about your bot such as its token, along with other configuration things such as colors. You can use the `template.env` file as a template, and clone it and rename the clone to `.env`. Then proceed to fill out the entries accordingly (instructions provided in template).

Now you're ready to actually run the bot. You can do this by doing `npm run catalyst`, which will run `node src/server.js` and start executing the `server.js` file in the `src` directory. That's all there is to running Catalyst!

# Development
Development is very easy on Catalyst, thanks to it's modularity. A majority of the code is in commands, which are split into inividual files in the `commands` directory. Additional sub-directories are used to indicate command categories.

## Commands
Making a command can be done by just creating a JavaScript file in the `commands` sub-directory. All commands are classes, since Catalyst follows an object-oriented design. The class is constructed upon startup, and placed as a field in the main object (often called `catalyst` in code). This is passed as a parameter to the constuctor. Here's a way you could structure a command class:
```js
class MyCommand {
	constructor(catalyst) {
		this.catalyst = catalyst;
	}
};
```
If you haven't noticed earlier, you'd have noticed that this command actually doesn't do anything. Other than being constructed, there's no function that can be run when the command is called. This function is called `run`. It's provided the main bot object, the message called it, and the pre-parsed arguments for it.
```js
class MyCommand {
	run(catalyst, commands, arguments) {
		console.log("I was run!");
	}
	
	constructor(catalyst) {
		this.catalyst = catalyst;
	}
};
```
Now we have a fully functioning command. If you've noticed earlier where I demonstrated how you can do `help <command>` to get information about a command, you might be wondering how you would do this. We can do this by declaring them as fields in the constructor.
```js
class MyCommand {
	run(catalyst, commands, arguments) {
		console.log("I was run!");
	}
	
	constructor(catalyst) {
		this.catalyst = catalyst;

		this.name = "myCommand";
		this.description = "It's my example command!";
		this.aliases = ["myAmazingCommand"];
	}
};
```
| Field | Type | Description |
|--|--|--|
| name | String | The name of the command |
| description | String | Information about the command and what it does |
| perms | Array\<String\> | List of permissions required to run the command |
| aliases | Array\<String\> | Alternative ways to call the command |
| cooldown | Integer | Amount of milliseconds in the cooldown for executing the command |
| argFormat | Array\<String\> | List of the format of arguments |

### Case study: Ping command
In this case study we'll go over the ping command and how it works. This command just gets the latency of the bot and displays it. Let's take a look at the code altogether to see what we're working with:
```js
class PingCommand {
	/**
	* ping command
	* @param catalyst the framework
	* @param message the message that called the command
	* @param args any arguments provided in the message
	*/
	async run(catalyst, message, args) {
		/* send a message */
		message.channel.send(`Pinging...`).then(reply => {
			/* calculate delta time, and edit message accordingly */
			var deltaTime = reply.createdAt - message.createdAt;
			reply.edit(`🏓 Pong! Took ${deltaTime} ms (API latency: ${catalyst.client.ws.ping} ms).`);
		});
	};

	constructor(catalyst) {
		this.catalyst = catalyst;

		/* command info */
		this.name = "ping";
		this.description = "Pings the bot's connection with the Discord API";
		this.aliases = ["pingTest", "getPing"];
		this.argFormat = null;
	}
};
```
This may seem overwhelming at first, but let's go over it step by step. Let's first take a look at the run function.
```js
	/**
	* ping command
	* @param catalyst the framework
	* @param message the message that called the command
	* @param args any arguments provided in the message
	*/
	async run(catalyst, message, args) {
		/* send a message */
		message.channel.send(`Pinging...`).then(reply => {
			/* calculate delta time, and edit message accordingly */
			var deltaTime = reply.createdAt - message.createdAt;
			reply.edit(`🏓 Pong! Took ${deltaTime} ms (API latency: ${catalyst.client.ws.ping} ms).`);
		});
	};
```
From the comments, we can see what's going on here. The bot sends a message, and finds out the latency by getting the difference between the time the message was created and the time the reply was created. It then edits that message and displays this information.

We send the message using the `message.channel.send` function, which returns the message object that was created:
```js
/* send a message */
message.channel.send(`Pinging...`).then(reply => {```
```
We then add a function to be executed after the command is complete (since it's a [promise]([https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)), which is run with the message that was created.

Let's now look at what happens inside this function:
```js
/* calculate delta time, and edit message accordingly */
var deltaTime = reply.createdAt - message.createdAt;
reply.edit(`🏓 Pong! Took ${deltaTime} ms (API latency: ${catalyst.client.ws.ping} ms).`);
```
We can see that `deltaTime` stores the difference in the reply's creation time and the message's creation time. We also get `catalyst.client.ws.ping`, which is the field that shows the api latency.

## Modules
Catalyst's source-tree is split by category. Most of the driver code is in the `modules` folder. Each module is essentially a part of the bot. Upon startup, the main program will go through the modules are execute them one by one. Modules are used mainly for organizing code so it can easily be passed around. For example, If I made the module `myModule` and wanted to access it from anoter script, I could do `catalyst.modules.myModule`.
```js
class MyModule {
	constructor(catalyst) {
		catalyst.myModule = this;
	}
};
```