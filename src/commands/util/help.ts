// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { MessageEmbed, Permissions, ColorResolvable } from 'discord.js';
import formatter from 'utils/formatter';
import GuildData, { GuildDocument } from 'models/guildData';
import OptionParser from 'utils/optionParser';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import * as Fluid from 'libs/fluid';
import HelpMenu from '@components/helpMenu';
import CatalystClient from 'core/client';
import CommandHandler from '@modules/commands';

const { NAME, PREFIX, SUPPORT_SERVER, CLIENT_ID, DEFAULT_COLOR } = config;
const { warning } = formatter('Help Command');

export default class HelpCommand extends Command {
  async argumentHelp(_client: CatalystClient, given: CommandGiven, command: Command, argumentName: string) {
    const option = command.options.find(o => o.name === argumentName);
    if (!option) {
      return given.reply(warning('Unable to find argument.'));
    }

    const embed = new MessageEmbed()
      .setTitle(`${command.name} <${option.name}>`)
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(option.desc)
      .addField('Type', option.type ?? 'string')
      .addField('Required', option.required ? 'yes' : 'no');
    given.reply({ embeds: [embed] });
  }

  async commandHelp(client: CatalystClient, given: CommandGiven, parser: OptionParser, commandName: string) {
    const commandHandler = client.getModule<CommandHandler>('commandHandler');
    const command = commandHandler.findCommand(commandName);
    if (!command) {
      return given.reply(warning('Unable to find command.'));
    }

    const argumentName = await parser.getOption('argument');
    if (argumentName) {
      return await this.argumentHelp(client, given, command, argumentName);
    }

    const argumentInfo: Array<string> = [];
    let usage = `${PREFIX}${command.name}`;
    for (const option of command.options) {
      argumentInfo.push(`**${option.name}${option.required ? '\\*' : ''}**  ${option.desc}`);
      usage = usage.concat(` <${option.name}>`);
    }

    const embed = new MessageEmbed()
      .setTitle(`${command.name} command`)
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(command.desc)
      .addField('Usage', usage);

    if (argumentInfo.length > 0) {
      embed.addField('Arguments', argumentInfo.join('\n'));
    }
    given.reply({ embeds: [embed] });
  }

  async run(client: CatalystClient, given: CommandGiven, args: CommandArgs) {
    const commandHandler = client.getModule<CommandHandler>('commandHandler');
    const parser = new OptionParser(this, given, args);
    const commandName = (await parser.getOption('command')) as string | undefined;
    const argumentName = (await parser.getOption('argument')) as string | undefined;

    if (commandName) {
      return await this.commandHelp(client, given, parser, commandName);
    }
    if (argumentName) {
      return given.reply(warning('No command provided.'));
    }

    const config: GuildDocument =
      (await GuildData.findOne({ id: given.guild?.id })) ?? (await GuildData.create({ id: given.guild?.id }));
    const prefix = config.prefix ?? PREFIX;
    const invite = `https://discord.com/oauth2/authorize?&client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=2134207679`;

    const commands = commandHandler.commands;
    const helpMenu = new HelpMenu({
      prefix,
      invite,
      commands,
      name: NAME,
      supportServer: SUPPORT_SERVER
    });
    Fluid.mount(helpMenu, given, { time: 15_000 });
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'help',
      desc: 'Provides basic information about the bot or a command.',
      perms: [Permissions.FLAGS.SEND_MESSAGES],
      options: [
        {
          name: 'command',
          type: 'string',
          desc: 'The command to get information about.',
          prompt: 'What command do you want to know about?',
          required: false
        },
        {
          name: 'argument',
          type: 'string',
          desc: 'The command argument to get information about.',
          prompt: "Which of the command's arguments do you want to know about?",
          required: false
        }
      ]
    });
  }
}
