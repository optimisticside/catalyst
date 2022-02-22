// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import formatter from 'utils/formatter';
import { Permissions, Message, User, GuildMember, TextChannel } from 'discord.js';
import Module from 'structs/module.js';
import Command, { CommandArgs, CommandGiven, CommandOption, CommandValidator } from 'structs/command';
import { CommandGroup, SubCommandGroup } from 'structs/group';
import Serializer from 'utils/serializer';
import GuildData from 'models/guildData';
import UserData, { UserDocument } from 'models/userData';
import glob from 'glob-promise';
import * as path from 'path';
import CatalystClient from 'core/client';
import { resolveFile } from 'utils/file';
import EventModule from '@modules/events';

const { PREFIX, CREATORS, COOLDOWN_PERSISTANCE_THRESHOLD } = config;
const { warning, denial, prompt, alert } = formatter('Command Handler');

export default class CommandModule extends Module {
  commands: Array<Command> = [];
  groups: Array<CommandGroup> = [];
  subGroups: Array<SubCommandGroup> = [];
  cooldowns: Map<string, number> = new Map();
  validator?: CommandValidator;

  checkPerms(required: Array<bigint>, member: GuildMember, channel?: TextChannel) {
    let perms = member.permissions;
    if (channel) perms = channel.permissionsFor(member);
    return required.every(p => perms.has(p)) || perms.has(Permissions.FLAGS.ADMINISTRATOR);
  }

  findCommand(commandCall: string) {
    commandCall = commandCall.toLowerCase();
    return this.commands.find(command => {
      if (command.name.toLowerCase() === commandCall) return true;
      if (!command.aliases) return false;
      return command.aliases.find(a => a.toLowerCase() === commandCall);
    });
  }

  async executeCommand(command: Command, ...params: [CommandGiven, CommandArgs]) {
    if (!command.run) return;
    this.emit('commandExecute', command, ...params);
    return await command.run(...params);
  }

  async handleArgChoices(option: CommandOption, given: string) {
    if (option.choices && option.choices !== []) {
      const choice = option.choices.find(c => c.name === given);
      if (choice && (given === choice.name || given === choice.value)) return choice.value;
    }
  }

  async parseArg(message: Message | null, option: CommandOption, given: string) {
    switch (option.type) {
      case 'text':
      case 'raw':
      case 'string':
      default: {
        if (option.choices) return this.handleArgChoices(option, given);
        return given;
      }
      case 'time': {
        const units = {
          seconds: 1,
          minutes: 1 * 60,
          hours: 1 * 60 * 60,
          days: 1 * 60 * 60 * 24,
          weeks: 1 * 60 * 60 * 24 * 7,
          months: 1 * 60 * 60 * 24 * 30.5,
          years: 1 * 60 * 60 * 24 * 30.5 * 365.25
        };
        let result = 0;
        const parts = given.match(/(\d+[A-Za-z]+)/g);
        parts?.map(part => {
          const numPart = part?.match(/\d+/g)?.at(0);
          const unitName = numPart && part.substring(numPart.length);

          // TODO: This code can be greatly improved.
          const unitEntries = Object.entries(units);
          const unit = unitName && unitEntries.find(([name]) => name.startsWith(unitName));
          if (!unit || !numPart) throw new TypeError('Invalid unit');
          result += parseInt(numPart) * unit[1];
        });
        return result * 1000;
      }
      case 'integer': {
        if (option.choices) return this.handleArgChoices(option, given);
        const int = parseInt(given);
        if (isNaN(int)) throw 'Invalid integer';
        if (option.minimum && int < (option.minimum as number)) throw new RangeError('Below minimum');
        if (option.maximum && int > (option.maximum as number)) throw new RangeError('Below minimum');
        return int;
      }
      case 'number': {
        const float = parseFloat(given);
        if (isNaN(float)) throw 'Invalid number';
        if (option.minimum && float < (option.minimum as number)) throw new RangeError('Below minimum');
        if (option.maximum && float > (option.minimum as number)) throw new RangeError('Below minimum');
        return float;
      }
      case 'boolean':
        return given === 'yes' || given === 'true' || given === 'on';
      case 'user': {
        const match = Serializer.deserializeUser(given);
        return message?.guild?.members.cache.get(match);
      }
      // The 'member' argument-type is for when
      // the user MUST be in the guild
      case 'member': {
        const match = Serializer.deserializeUser(given);
        return message?.guild?.members.cache.get(match);
      }
      case 'channel': {
        const match = Serializer.deserializeChannel(given);
        return message?.guild?.channels.cache.get(match);
      }
      case 'role': {
        const match = Serializer.deserializeRole(given);
        return message?.guild?.roles.cache.get(match);
      }
      case 'mentionable': {
        const match = Serializer.deserializeMentionable(given);
        return message?.guild?.roles.cache.get(match);
      }
    }
  }

  promptArg(message: Message, option: CommandOption): Promise<string> {
    return new Promise((resolve, reject) => {
      message.channel.send(prompt(option.prompt ?? `Enter ${option.name} (${option.type}):`)).then((reply: Message) => {
        const filter = (m: Message) => m.author === message.author;
        const collector = message.channel.createMessageCollector({
          filter,
          max: 1,
          time: 60000
        });
        collector.on('collect', m => resolve(m.content));
        collector.on('end', () => reject(reply));
      });
    });
  }

  async handleArgs(message: Message, command: Command, args: Array<string>) {
    const result: CommandArgs = {};
    const handler = async (option: CommandOption) => {
      let given: string | void = args[command.options.indexOf(option)];

      // Ignore option if not given and not required.
      // Prompt for input if required and not given
      // and no default value.
      // Parse argument and only add if successful.
      //   Else, display syntax error to user.
      if (!given && !option.required) return;
      if (!given && option.required) {
        given = await this.promptArg(message, option).catch((reply: Message) => {
          // This is done under the assumption that `promptArg` is
          // rejecting because it timed out.
          if (!(reply instanceof Message)) return;
          reply.reply(alert('Prompt timed out'));
        });
      }
      if (!given) return;
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
    for (const option of command.options) {
      await handler(option);
    }
    return result;
  }

  async getCooldown(user: User, command: Command) {
    if (!command) return;
    const key = `${user.id}:${command.name}`;
    const fromMap = this.cooldowns.get(key);
    if (fromMap) return fromMap;
    const userData: UserDocument | null = await UserData.findOne({ id: user.id });
    return userData?.cooldowns.get(command.name)?.getTime();
  }

  async saveCooldown(user: User, command: Command) {
    if (!command) return;
    if (!command.cooldown) return;
    const now = Date.now();

    // If the cooldown is longer than a certain threshold,
    // we will store it in MongoDB in case we have to restart.
    if (command.cooldown > COOLDOWN_PERSISTANCE_THRESHOLD) {
      const userData: UserDocument = (await UserData.findOne({ id: user.id })) ?? (await UserData.create({ id: user.id }));
      userData.cooldowns.set(command.name, new Date(now));
      userData.markModified('cooldowns');
      await userData.save();
    } else {
      const key = `${user.id}:${command.name}`;
      this.cooldowns.set(key, now);
    }
  }

  async clearCooldown(user: User, command: Command) {
    // `if` statements fail if the value is 0,
    // which is used intentionally.
    if (!command) return;
    if (command.cooldown) return;
    const key = `${user.id}:${command.name}`;
    if (this.cooldowns.has(key)) {
      this.cooldowns.delete(key);
      return;
    }

    const userData = ((await UserData.findOne({ id: user.id })) ??
      (await UserData.create({ id: user.id }))) as UserDocument;
    userData.cooldowns.delete(command.name);
    userData.markModified('cooldowns');
    await userData.save();
  }

  async handleStatement(message: Message, statement: string) {
    const content = statement.trim();
    const args = (content.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []).map(a => a.replaceAll('"', ''));
    const commandCall = args.shift();
    const command = commandCall && this.findCommand(commandCall);
    const lastRun = command && (await this.getCooldown(message.author, command));

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
    if (!(message.channel instanceof TextChannel)) return;
    if (!command || !command.run) {
      // After close consideration, I've decieded that
      // it's probably better to not warn of invalid commands.
      return; // message.reply(warning(`\`${commandCall}\` is not a valid command.`));
    }
    if (command.guildOnly && !message.guild) {
      return message.reply(denial('Guild-only commands cannot be run outside of a guild.'));
    }
    if (command.creatorOnly && !CREATORS.find(c => c === message.author.id)) {
      return message.reply(denial('Creator-only commands can only run by bot creators.'));
    }
    if (command.ownerOnly && (!message.guild || message.author.id !== message.guild.ownerId)) {
      return message.reply(denial('Owner-only commands can only be run by the guild owner.'));
    }
    if (command.nsfw && (!message.guild || !message.channel.nsfw)) {
      return message.reply(denial('NSFW commands can only be run in NSFW channels.'));
    }
    if (message.member && !this.checkPerms(command.userPerms, message.member, message.channel)) {
      return message.reply(denial('You do not have the permissions required by this command.'));
    }
    if (message.guild?.me && !this.checkPerms(command.botPerms, message.guild.me, message.channel)) {
      return message.reply(denial('I do not have the permissions required to run this command.'));
    }
    if (lastRun) {
      const deltaTime = Date.now() - lastRun;
      if (deltaTime <= command.cooldown) {
        const timeLeft = command.cooldown - deltaTime;
        return message.reply(
          denial(`You're on cooldown. Please wait ${Math.ceil(timeLeft / 1000)} seconds before trying again.`)
        );
      } else {
        this.clearCooldown(message.author, command);
      }
    }
    if (
      (this.validator && !(await this.validator(message, command))) ||
      (command.validate && !(await command.validate(message)))
    ) {
      return message.reply(denial('Command validation failed.'));
    }

    await this.handleArgs(message, command, args)
      .then(finalArgs => {
        this.executeCommand(command, message, finalArgs)
          .then(() => {
            this.saveCooldown(message.author, command);
            this.emit('commandRun', message, command, finalArgs);
          })
          .catch(err => {
            this.logger.error(`Unable to run ${command.name} command: ${err}`);
            message.reply(warning('An error occured during command execution.'));
          });
      })
      .catch(() => {
        // TODO: Fix this bad error handling.
        // We don't have to do anything here.
        // This is just to mute errors from handling arguments.
      });
  }

  async loadCommand(file: string) {
    const command = await resolveFile<Command | CommandGroup | SubCommandGroup>(file, this.client);
    if (command instanceof Command) return this.commands.push(command);
    if (command instanceof CommandGroup) return this.groups.push(command);
    if (command instanceof SubCommandGroup) return this.subGroups.push(command);
  }

  async loadCommands() {
    const files = await glob(path.join(__dirname, '/../commands/**/*.js'));
    await Promise.all(files.map(this.loadCommand.bind(this)));
    this.logger.info('Commands loaded');
    this.emit('commandsLoad');
  }

  async handleMessage(message: Message) {
    if (message.author.bot) return;
    let content = message.content.trim();
    let config, guildPrefix;
    if (message.guild) {
      config =
        (await GuildData.findOne({ id: message.guild.id })) ?? (await GuildData.create({ id: message.guild.id }));
      guildPrefix = config.prefix;
    }

    if (!this.client.user) return;
    const prefixes = [`<@${this.client.user.id}>`, `<@!${this.client.user.id}>`].concat(guildPrefix ?? PREFIX);
    const prefix = prefixes.find(p => content.startsWith(p));
    if (!prefix) return;
    content = content.slice(prefix.length);

    const statements = content.match(/(?!;|$)[^;"]*(("[^"]*")[^;"]*)*/g);
    if (!statements) return;
    statements.map(s => this.handleStatement(message, s));
  }

  load() {
    const eventHandler = this.client.getModule<EventModule>('eventHandler');

    this.loadCommands();
    eventHandler.on('messageCreate', this.handleMessage.bind(this));
  }

  constructor(client: CatalystClient) {
    super({
      name: 'commandHandler',
      client: client
    });
  }
}
