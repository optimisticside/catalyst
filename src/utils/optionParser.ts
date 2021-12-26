// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { CommandInteraction, Message } from 'discord.js';
import CatalystClient from 'core/client';
import Command from 'structs/command';
import CommandHandler from '@modules/commands';

export default class OptionParser {
  given: Message | CommandInteraction;
  command: Command;
  args: {[key: string]: any};

  async getOption(name: string) {
    const client: CatalystClient = this.given.client as CatalystClient;
    const option = this.command.options.find(o => o.name === name);
    if (!option) return;
    if (this.given instanceof Message) {
      return this.args[name];
    }

    switch (option.type) {
      case 'text': case 'raw': case 'string':
        return this.given.options.getString(name);
      case 'integer':
        return this.given.options.getInteger(name);
      case 'number':
        return this.given.options.getNumber(name);
      case 'boolean':
        return this.given.options.getBoolean(name);
      case 'user':
        return this.given.options.getUser(name);
      case 'member':
        // const user = this.given.options.getUser(name);
        // if (!user) return;
        // return this.given.guild.members.cache.find(m => m.user === user);
        return this.given.options.getMember(name);
      case 'channel':
        return this.given.options.getChannel(name);
      case 'role':
        return this.given.options.getRole(name);
      case 'mentionable':
        return this.given.options.getMentionable(name);
      default:
        // Handles special arguments not supported by Discord,
        // such as time. If it's still not found then the command
        // handler's parser can handle it.
        const raw = this.given.options.getString(name);
        if (!raw) return;
        const commandHandler = client.modules.commandHandler as unknown as CommandHandler;
        return commandHandler.parseArg(null, option, raw);
    }
  }

  constructor(command: Command, given: Message | CommandInteraction, args) {
    this.command = command;
    this.given = given;
    this.args = args;
  }
}