// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { PREFIX, CREATOR } = require('../config.json');
const { warning, denial, log, prompt } = require('../util/formatter.js')('Command Handler');
const { GuildChannel, Permissions } = require('discord.js');
const Module = require('../structs/module.js');
const Command = require('../structs/command.js');
const { CommandGroup, SubCommandGroup } = require('../structs/group.js');
const glob = require('glob');
const path = require('path');

module.exports = class Commands extends Module {
  async checkPerms(required, member, channel) {
    //if (member.user.id === CREATOR) return true;
    let perms = member.permissions;
    if (channel) perms = channel.permissionsFor(member);
    return required.every(p => perms.has(p)) || perms.has(Permissions.FLAGS.ADMINISTRATOR);
  }

  async findCommand(commandCall) {
    commandCall = commandCall.toLowerCase();
    return this.commands.find(command => {
      if (command.name.toLowerCase() === commandCall) return true;
      if (!command.aliases) return false;
      return command.aliases.find(a => a.toLowerCase() === commandCall);
    });
  }

  async executeCommand(command, ...params) {
    if (!command.run) return;
    this.emit('commandExecute', command, ...params);
    return await command.run(...params);
  }

  async handleArgChoices(option, given) {
    if (option.choices && option.choices !== []) {
      const choice = option.choices.find(c => c.name === given);
      if (given === choice.name || given === choice.value) return choice.value;
    }
  }

  async parseArg(message, option, given) {
    switch (option.type) {
      case 'text': case 'raw': case 'string': default: {
        if (option.choices) return this.handleArgChoices(option, given);
        return given;
      }
      case 'time':
        const units = {
          s: 1,
          m: 1 * 60,
          h: 1 * 60 * 60,
          d: 1 * 60 * 60 * 24,
          w: 1 * 60 * 60 * 24 * 7,
          t: 1 * 60 * 60 * 24 * 30.5,
          y: 1 * 60 * 60 * 24 * 30.5 * 365.25
        };
        let lastChar, result = 0;
        [ ...given ].map(char => {
          if (units[char]) return;
          const raw = given.substring(lastChar ?? 0, given.charAt(char));
          const unit = units[char];
          result += parseInt(raw) * unit;
        });
        return result;
      case 'integer':
        if (option.choices) return this.handleArgChoices(option, given);
        const int = parseInt(given);
        if (isNaN(int)) throw 'Invalid integer';
        return int;
      case 'number':
        const num = parseFloat(given);
        if (isNaN(num)) throw 'Invalid number';
        return num;
      case 'boolean':
        return (given === 'yes' || given === 'true' || given === 'on');
      case 'user': {
        const matches = given.match(/^<@!?(\d+)>$/);
        return message.guild.users.cache.get(matches[1]);
      }
      // The 'member' argument-type is for when
      // the user MUST be in the guild
      case 'member': {
        const matches = given.match(/^<@!?(\d+)>$/);
        return message.guild.members.cache.get(matches[1]);
      }
      case 'channel': {
        const matches = given.match(/^<#(\d+)>$/);
        return message.guild.channels.cache.get(matches[1]);
      }
      case 'role': {
        const matches = given.match(/^<@!?(\d+)>$/);
        return message.guild.roles.cache.get(matches[1]);
      }
      case 'mentionable': {
        const matches = given.match(/^@?(\s+)$/);
        return message.guild.roles.cache.get(matches[1]);
      }
    }
  }

  promptArg(message, option) {
    return new Promise((resolve, reject) => {
      message.channel.send(prompt(option.prompt ?? `Enter ${object.name} (${object.type}):`));
      const filter = m => m.author === message.author;
      const collector = message.channel.createMessageCollector({ filter, max: 1, time: 60000 });
      collector.on('collect', m => resolve(m.content));
      collector.on('end', reject);
    });
  }

  async handleArgs(message, command, args) {
    let result = {};
    const promises = command.options.map(async option => {
      let given = args[command.options.indexOf(option)];

      // Ignore option if not given and not required.
      // Prompt for input if required and not given
      // and no default value.
      // Parse argument and only add if successful.
      //   Else, display syntax error to user.
      if (!given && !option.required) return;
      if (!given && option.required) {
        given = await this.promptArg(message, option);
      }
      await this.parseArg(message, option, given).then(final => {
        result[option.name] = final;
      }).catch(err => {
        message.channel.send(warning(`\`${given}\` is not a valid ${option.type}`));
        throw err;
      });
    });

    await Promise.all(promises);
    return result;
  }

  async handleStatement(message, statement) {
    let content = statement.trim();
    let args = content.match(/(?:[^\s"]+|"[^"]*")+/g);
    const commandCall = args.shift();
    const command = await this.findCommand(commandCall);

    // Command execution requirements:
    // Blacklist/whitelist system must allow user.
    // Command must exist (obviously).
    // Bot must have permissions.
    // User must have permissions.
    // NSFW commands must only run in NSFW channels.
    // Guild-only commands must only run in guild channels.
    // Owner-only commands must only be run by the owner
    //   of the guild (must be in guild channel).
    // Command's independent validation test must pass.
    if (!command || !command.run) {
      // After close consideration, I've decieded that
      // it's probably better to not warn of invalid commands.
      return // message.channel.send(warning(`\`${commandCall}\` is not a valid command.`));
    }
    if (command.guildOnly && !message.guild) {
      return message.channel.send(denial('Guild-only commands cannot be run outside of a guild.'));
    }
    if (command.ownerOnly && (!message.guild || !message.author.id === message.guild.ownerID)) {
      return message.channel.send(denial('Owner-only commands can only be run by the owner.'));
    }
    if (command.nsfw && (!message.guild || !message.channel.nsfw)) {
      return message.channel.send(denial('NSFW commands can only be run in NSFW channels.'));
    }
    if (!await this.checkPerms(command.userPerms, message.member,
        message.channel instanceof GuildChannel && message.channel)) {
      return message.channel.send(denial('You do not have the permissions required by this command.'));
    }
    if (!await this.checkPerms(command.botPerms, message.guild.me,
        message.channel instanceof GuildChannel && message.channel)) {
      return message.channel.send(denial('I do not have the permissions required to run this command.'));
    }
    if ((this.validator && !await this.validator(message, command))
        || (command.validator && !await command.validator(message))) {
       return message.channel.send(denial('Command validation failed.'));
    }

    await this.handleArgs(message, command, args).then(finalArgs => {
      this.executeCommand(command, this.client, message, finalArgs).catch(err => {
        console.error(`Unable to run ${command.name} command: ${err}`);
        message.channel.send(warning('An error occured during command execution.'));
      });
    }).catch(err => {
      // TODO: Fix this bad error handling.
      // We don't have to do anything here.
      // This is just to mute errors from handling arguments.
    });
  }

  async loadCommand(file) {
    const commandClass = require(file);
    const command = new commandClass(this.client);
    if (command instanceof Command) return this.commands.push(command);
    if (command instanceof CommandGroup) return this.groups.push(command);
    if (command instanceof SubCommandGroup) return this.subGroups.push(command);
  }

  async loadCommands() {
    const files = glob.sync(path.join(__dirname, '/../commands/**/*.js'));
    await Promise.all(files.map(this.loadCommand.bind(this)));
    console.log('Commands loaded');
    this.emit('commandsLoad');
  }

  async handleMessage(message) {
    let content = message.content.trim();
    const guildPrefix = message.guild && await this.database.getGuild(message.guild.id, 'prefix');
    const prefixes = [ `<@${this.client.user.id}>`, `<@!${this.client.user.id}>`, PREFIX ].concat(guildPrefix);
    const prefix = prefixes.find(p => content.startsWith(p));
    if (!prefix) return;
    content = content.slice(prefix.length);

    const statements = content.match(/(?!;|$)[^;"]*(("[^"]*")[^;"]*)*/g);
    if (!statements) return;
    statements.map(s => this.handleStatement(message, s));
  }

  load({ eventHandler, database }) {
    this.loadCommands();
    this.database = database;
    eventHandler.on('messageCreate', this.handleMessage.bind(this));
  }

  constructor(client) {
    super({
      name: 'commandHandler',
      client: client
    });

    this.commands = [];
    this.groups = [];
    this.subGroups = [];
  }
};