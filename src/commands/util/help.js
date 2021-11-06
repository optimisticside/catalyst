// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { MessageEmbed, Permissions } = require('discord.js');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const permNames = require('../../util/permNames.js');
const { warning } = require('../../util/formatter.js')('Invite Command');
const { NAME, PREFIX, DEFAULT_COLOR } = require('../../config.json');

module.exports = class HelpCommand extends Command {
  async argumentHelp(client, given, parser, command, argumentName) {
    const option = command.options.find(o => o.name === argumentName);
    if (!option) {
      return given.reply(warning('Unable to find argument.'));
    }

    const embed = new MessageEmbed()
      .setTitle(`${command.name} <${option.name}>`)
      .setColor(DEFAULT_COLOR)
      .setDescription(option.desc)
      .addField('Type', option.type ?? 'string')
      .addField('Required', (option.required ? 'yes' : 'no'));
    given.reply({ embeds: [ embed ] });
  }

  async commandHelp(client, given, parser, commandName) {
    const command = await client.commandHandler.findCommand(commandName);
    if (!command) {
      return given.reply(warning('Unable to find command.'));
    }

    const argumentName = await parser.getOption('argument');
    if (argumentName) {
      return await this.argumentHelp(client, given, parser, command, argumentName);
    }
    
    let argumentInfo = [];
    let usage = `${PREFIX}${command.name} `;
    await Promise.all(command.options.map(async option => {
      argumentInfo.push(`**${option.name}${option.required ? '\\*' : ''}**  ${option.desc}`);
      usage.concat(`<${option.name}>`);
    }));

    const embed = new MessageEmbed()
      .setTitle(`${command.name} command`)
      .setColor(DEFAULT_COLOR)
      .setDescription(command.desc)
      .addField('Usage', usage)
      .addField('Aliases', (command.aliases?.length > 0 ? command.aliases.join(', ') : 'None'))
      .addField('Arguments', (argumentInfo.length > 0 ? argumentInfo.join('\n') : 'None'));
      // .addField('User Perms', (command.userPerms?.length > 0 ? command.userPerms.map(p => permNames(p)).join(', ') : 'None'))
      // .addField('Bot Perms', (command.botPerms?.length > 0 ? command.botPerms.map(p => permNames(p)).join(', ') : 'None'))
  
    given.reply({ embeds: [ embed ] });
  }

  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    const commandName = await parser.getOption('command');
    const argumentName = await parser.getOption('argument');

    if (commandName) {
      return await this.commandHelp(client, given, parser, commandName);
    }
    if (argumentName) {
      return given.reply(warning('No command provided.'));
    }

    const prefix = await client.database.getGuild(given.guild.id, 'prefix') ?? PREFIX;
    const embed = new MessageEmbed()
      .setTitle(`${NAME}`)
      .setColor(DEFAULT_COLOR)
      .setDescription(`Hello! I'm ${NAME}. You can use me to run commands, as long as they start with the prefix \`${prefix}\`. For a list of commands, use the \`commands\` command, by doing \`${prefix}commands\`.`)
    given.reply({ embeds: [ embed ] });
  }

  constructor() {
    super({
      name: 'help',
      desc: 'Provides basic information about the bot or a command.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
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
          prompt: 'Which of the command\'s arguments do you want to know about?',
          required: false
        }
      ]
    });
  }
}