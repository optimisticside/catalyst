// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { PREFIX, CREATORS, COOLDOWN_PERSISTANCE_THRESHOLD } = require('../util/configParser.js');
const { warning, denial, log, prompt } = require('../util/formatter.js')('Command Handler');
const { GuildChannel, Permissions, Message } = require('discord.js');
const Module = require('../structs/module.js');
const Command = require('../structs/command.js');
const { CommandGroup, SubCommandGroup } = require('../structs/group.js');
const Serializer = require('../util/serializer.js');
const GuildConfig = require('../models/guildConfig.js');
const UserConfig = require('../models/userConfig.js');
const glob = require('glob');
const path = require('path');

module.exports = class Commands extends Module {
  async checkPerms(required, member, channel) {
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
        // TODO: We need a better system to parse
        // time intervals. It needs to be able to
        // handle units longer than 1 character.
        const units = {
          s: 1,
          m: 1 * 60,
          h: 1 * 60 * 60,
          d: 1 * 60 * 60 * 24,
          w: 1 * 60 * 60 * 24 * 7,
          u: 1 * 60 * 60 * 24 * 30.5,
          y: 1 * 60 * 60 * 24 * 30.5 * 365.25
        };
        let lastChar = 0;
        let result = 0;
        [ ...given ].map(char => {
          if (!units[char]) return;
          const raw = given.substring(lastChar, given.charAt(char));
          const unit = units[char];
          result += parseInt(raw) * unit;
        });
        return result;
      case 'integer':
        if (option.choices) return this.handleArgChoices(option, given);
        const int = parseInt(given);
        if (isNaN(int)) throw 'Invalid integer';
        if (option.minimum && int < minimum) throw 'Below minimum';
        if (option.maximum && int > minimum) throw 'Below minimum';
        return int;
      case 'number':
        const num = parseFloat(given);
        if (isNaN(num)) throw 'Invalid number';
        if (option.minimum && int < minimum) throw 'Below minimum';
        if (option.maximum && int > minimum) throw 'Below minimum';
        return num;
      case 'boolean':
        return (given === 'yes' || given === 'true' || given === 'on');
      case 'user': {
        const match = Serializer.deserializeUser(given);
        return message.guild.users.cache.get(match);
      }
      // The 'member' argument-type is for when
      // the user MUST be in the guild
      case 'member': {
        const match = Serializer.deserializeUser(given);
        return message.guild.members.cache.get(match);
      }
      case 'channel': {
        const match = Serializer.deserializeChannel(given);
        return message.guild.channels.cache.get(match);
      }
      case 'role': {
        const match = Serializer.deserializeRole(given);
        return message.guild.roles.cache.get(match);
      }
      case 'mentionable': {
        const match = Serializer.deserializeMentionable(given);
        return message.guild.roles.cache.get(match);
      }
    }
  }

  promptArg(message, option) {
    return new Promise((resolve, reject) => {
      message.channel.send(prompt(option.prompt ?? `Enter ${object.name} (${object.type}):`)).then(reply => {
        const filter = m => m.author === message.author;
        const collector = message.channel.createMessageCollector({ filter, max: 1, time: 60000 });
        collector.on('collect', m => resolve(m.content, reply));
        collector.on('end', () => reject(reply));
      });
    });
  }

  async handleArgs(message, command, args) {
    const result = {};
    const handler = async option => {
      let given = args[command.options.indexOf(option)];

      // Ignore option if not given and not required.
      // Prompt for input if required and not given
      // and no default value.
      // Parse argument and only add if successful.
      //   Else, display syntax error to user.
      if (!given && !option.required) return;
      if (!given && option.required) {
        given = await this.promptArg(message, option).catch(reply => {
          // This is done under the assumption that `promptArg` is
          // rejecting because it timed out.
          if (!reply instanceof Message) return;
          reply.reply(alert('Prompt timed out'));
        });
      }
      await this.parseArg(message, option, given)
        .then(final => {
          result[option.name] = final;
        })
        .catch(err => {
          message.channel.send(warning(`\`${given}\` is not a valid ${option.type}`));
          throw err;
        });
    };

    // A for loop needs to be used since we want the
    // handlers to be run sequentially but also be asynchronous.
    for (let option of command.options) {
      await handler(option);
    }
    return result;
  }

  async getCooldown(user, command) {
    if (!command) return;
    const key = `${user.id}:${command.name}`;
    const fromMap = this.cooldowns.get(key);
    if (fromMap) return fromMap;
    const userConfig = await UserConfig.findOne({ id: user.id });
    const cooldown = userConfig?.cooldowns.find(cd => cd.command == command.name);
    return cooldown?.since;
  }

  async saveCooldown(user, command) {
    if (!command) return;
    if (!command.cooldown) return;
    const now = Date.now();
    
    // If the cooldown is longer than a certain threshold,
    // we will store it in MongoDB in case we have to restart.
    if (command.cooldown > COOLDOWN_PERSISTANCE_THRESHOLD) {
      const userConfig = await UserConfig.findOne({ id: user.id }) ??
        await UserConfig.create({ id: user.id });
      const current = userConfig.cooldowns.find(cl => cl.command === command.name) ??
        userConfig.cooldowns.push({ command: command.name });
      current.since = now;
      userConfig.markModified('cooldowns');
      await userConfig.save();
    } else {
      const key = `${user.id}:${command.name}`;
      this.cooldowns.set(key, now);
    }
  }

  async clearCooldown(user, command) {
    // `if` statements fail if the value is 0,
    // which is used intentionally.
    if (!command) return;
    if (command.cooldown) return;
    const key = `${user.id}:${command.name}`;
    if (this.cooldowns.has(key)) {
      this.cooldowns.delete(key);
      return;
    }

    const userConfig = await UserConfig.findOne({ id: user.id }) ??
      await UserConfig.create({ id: user.id });
    userConfig.cooldowns.filter(cl => cl.command === command.name);
    userConfig.markModified('cooldowns');
    await userConfig.save();
  }

  async handleStatement(message, statement, config) {
    let content = statement.trim();
    const args = content.match(/(?:[^\s"]+|"[^"]*")+/g)
      .map(a => a.replaceAll('"', ''));
    const commandCall = args.shift();
    const command = await this.findCommand(commandCall);
    const lastRun = await this.getCooldown(message.author, command);

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
      return // message.reply(warning(`\`${commandCall}\` is not a valid command.`));
    }
    if (command.guildOnly && !message.guild) {
      return message.reply(denial('Guild-only commands cannot be run outside of a guild.'));
    }
    if (command.creatorOnly && !CREATORS.find(c => c === message.author.id)) {
      return message.reply(denial('Creator-only commands can only run by bot creators.'));
    }
    if (command.ownerOnly && (!message.guild || !message.author.id === message.guild.ownerID)) {
      return message.reply(denial('Owner-only commands can only be run by the guild owner.'));
    }
    if (command.nsfw && (!message.guild || !message.channel.nsfw)) {
      return message.reply(denial('NSFW commands can only be run in NSFW channels.'));
    }
    if (!await this.checkPerms(command.userPerms, message.member,
        message.channel instanceof GuildChannel && message.channel)) {
      return message.reply(denial('You do not have the permissions required by this command.'));
    }
    if (!await this.checkPerms(command.botPerms, message.guild.me,
        message.channel instanceof GuildChannel && message.channel)) {
      return message.reply(denial('I do not have the permissions required to run this command.'));
    }
    if (lastRun) {
      const deltaTime = Date.now() - lastRun;
      if (deltaTime <= command.cooldown) {
        const timeLeft = command.cooldown - deltaTime;
        return message.reply(denial(`You're on cooldown. Please wait ${Math.ceil(timeLeft / 1000)} seconds before trying again.`));
      } else {
        this.clearCooldown(message.author, command);
      }
    }
    if ((this.validator && !await this.validator(message, command))
        || (command.validator && !await command.validator(message))) {
       return message.reply(denial('Command validation failed.'));
    }

    await this.handleArgs(message, command, args)
      .then(finalArgs => {
        this.executeCommand(command, this.client, message, finalArgs)
          .then(() => {
            this.saveCooldown(message.author, command);
            this.emit('commandRun', message, command, finalArgs);
          })
          .catch(err => {
            console.error(`Unable to run ${command.name} command: ${err}`);
            message.reply(warning('An error occured during command execution.'));
          });
      })
      .catch(err => {
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
    if (message.author.bot) return;
    let content = message.content.trim();
    let config, guildPrefix;
    if (message.guild) {
      config = await GuildConfig.findOne({ id: message.guild.id })
        ?? await GuildConfig.create({ id: message.guild.id });
      guildPrefix = config.prefix;
    }

    const prefixes = [ `<@${this.client.user.id}>`, `<@!${this.client.user.id}>` ].concat(guildPrefix ?? PREFIX);
    const prefix = prefixes.find(p => content.startsWith(p));
    if (!prefix) return;
    content = content.slice(prefix.length);

    const statements = content.match(/(?!;|$)[^;"]*(("[^"]*")[^;"]*)*/g);
    if (!statements) return;
    statements.map(s => this.handleStatement(message, s, config));
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

    this.cooldowns = new Map();
    this.commands = [];
    this.groups = [];
    this.subGroups = [];
  }
};