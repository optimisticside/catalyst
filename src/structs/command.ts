// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import CatalystClient from 'core/client';
import { ApplicationCommandOptionChoice, AutocompleteInteraction, CommandInteraction, Message } from 'discord.js';
import { createLogger, Logger } from 'utils/logger';
const { DEFAULT_COOLDOWN } = config;

export type CommandGiven = CommandInteraction | Message;
export type CommandValidator = (given: CommandGiven, command: Command) => Promise<boolean>;
export type CommandArgs = { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface CommandOption {
  name: string;
  type: string;
  desc: string;
  prompt?: string;
  required?: boolean;
  choices?: Array<ApplicationCommandOptionChoice>;
  minimum?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  maximum?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  autoComplete?: (current: AutocompleteInteraction) => Promise<Array<ApplicationCommandOptionChoice>>;
}

export interface CommandInfo {
  name: string;
  client: CatalystClient;
  aliases?: Array<string>;
  options?: Array<CommandOption>;
  group?: string;
  subGroup?: string;
  groupMember?: string;
  desc?: string;
  cooldown?: number;
  tags?: Array<string>;
  examples?: Array<string>;
  authors?: Array<string>;
  userPerms?: Array<bigint>;
  botPerms?: Array<bigint>;
  perms?: Array<bigint>;
  passive?: boolean;
  hidden?: boolean;
  guildOnly?: boolean;
  ownerOnly?: boolean;
  creatorOnly?: boolean;
  allowBots?: boolean;
  nsfw?: boolean;
}

export default abstract class Command {
  name: string;
  client: CatalystClient;
  logger: Logger;
  aliases: Array<string> = [];
  options: Array<CommandOption> = [];
  group?: string;
  subGroup?: string;
  groupMember?: string;
  desc = 'No description provided';
  cooldown = DEFAULT_COOLDOWN;
  tags: Array<string> = [];
  examples: Array<string> = [];
  authors: Array<string> = [];
  userPerms: Array<bigint> = [];
  botPerms: Array<bigint> = [];
  passive = true;
  hidden = false;
  guildOnly = false;
  ownerOnly = false;
  creatorOnly = false;
  allowBots = false;
  nsfw = false;

  async validate(given: CommandGiven): Promise<boolean> {
    return given !== null;
  }

  async run(_given: CommandGiven, _args: CommandArgs): Promise<void> {
    throw new Error(`${this.name} doesn't have a run() method.`);
  }

  constructor(info: CommandInfo) {
    this.name = info.name;
    this.client = info.client;
    this.aliases = info.aliases ?? this.aliases;
    this.options = info.options ?? this.options;
    this.group = info.group;
    this.subGroup = info.subGroup;
    this.groupMember = info.groupMember ?? info.name;
    this.desc = info.desc ?? this.desc;
    this.cooldown = info.cooldown ?? this.cooldown;
    this.tags = info.tags ?? this.tags;
    this.examples = info.examples ?? this.examples;
    this.authors = info.authors ?? this.authors;
    this.userPerms = info.userPerms ?? info.perms ?? this.userPerms;
    this.botPerms = info.botPerms ?? info.perms ?? this.botPerms;
    this.passive = info.passive ?? this.passive;
    this.hidden = info.hidden ?? this.hidden;
    this.guildOnly = info.guildOnly ?? this.guildOnly;
    this.ownerOnly = info.ownerOnly ?? this.ownerOnly;
    this.creatorOnly = info.creatorOnly ?? this.creatorOnly;
    this.allowBots = info.allowBots ?? this.allowBots;
    this.nsfw = info.nsfw ?? this.nsfw;
    this.logger = createLogger({
      cluster: this.client.shard?.clusterCount,
      shard: this.client.shard?.id,
      command: this.name
    });
  }
}
