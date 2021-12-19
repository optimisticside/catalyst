// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { NAME, PREFIX, SUPPORT_SERVER, CLIENT_ID, DEFAULT_COLOR } = require('../../util/configParser.js');
const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const { warning, success } = require('../../util/formatter.js')('Invite Command');
const GuildConfig = require('../../models/guildConfig.js');
const OptionParser = require('../../util/optionParser.js');
const Command = require('../../structs/command.js');
const Fluid = require('../../util/fluid.js');

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
    
    const argumentInfo = [];
    let usage = `${PREFIX}${command.name}`;
    for (let option of command.options) {
      argumentInfo.push(`**${option.name}${option.required ? '\\*' : ''}**  ${option.desc}`);
      usage = usage.concat(` <${option.name}>`);
    };

    const embed = new MessageEmbed()
      .setTitle(`${command.name} command`)
      .setColor(DEFAULT_COLOR)
      .setDescription(command.desc)
      .addField('Usage', usage);
    
    if (argumentInfo.length > 0) {
      embed.addField('Arguments', argumentInfo.join('\n'));
    }
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

    const config = await GuildConfig.findOne({ id: given.guild.id })
        ?? await GuildConfig.create({ id: given.guild.id });
    const prefix = config.prefix ?? PREFIX;
    const invite = `https://discord.com/oauth2/authorize?&client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=2134207679`;
    
    const CommandsComponent = new Fluid.Component(element => {
      const commands = client.commandHandler.commands;
      const embed = new MessageEmbed()
        .setTitle('Commands')
        .setColor(DEFAULT_COLOR)
        .setDescription(commands.map(c => c.name).join('\n'));

      return {
        embeds: [ embed ],
        components: [
          new MessageActionRow()
            .addComponents(
              new MessageButton({ label: 'Back', style: 'SECONDARY', customId: Fluid.redirect(element, element.previous) }),
            )
        ]
      };
    });

    const HelpComponent = new Fluid.Component(element => {
      const embed = new MessageEmbed()
        .setTitle(NAME)
        .setColor(DEFAULT_COLOR)
        .setDescription(`:wave: Hello, I'm ${NAME}! I'm a Discord bot that runs commands. You can run commands through the chat using the prefix \`${prefix}\`, or through slash commands.`);

      return {
        embeds: [ embed ],
        components: [
          new MessageActionRow()
            .addComponents(
              new MessageButton({ label: 'Commands', style: 'PRIMARY', customId: Fluid.redirect(element, CommandsComponent) }),
              new MessageButton({ label: 'Invite', style: 'LINK', url: invite }),
              new MessageButton({ label: 'Support Server', style: 'LINK', url: SUPPORT_SERVER })
            )
        ]
      };
    });

    const helpMenu = new Fluid.Element(HelpComponent);
    Fluid.mount(helpMenu, given, { time: 15_000 });
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