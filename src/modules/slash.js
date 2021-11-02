// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { GuildChannel } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { TOKEN } = require('../config.json');
const { warning, denial, prompt } = require('../util/formatter.js')('Slash Command Handler');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } = require('@discordjs/builders');
const Module = require('../structs/module.js');

module.exports = class SlashModule extends Module {
  async buildCommand(command, isSubCommand) {
    let builder = (isSubCommand ? new SlashCommandSubcommandBuilder() : new SlashCommandBuilder())
      .setName((isSubCommand && command.groupMember?.toLowerCase()) ?? command.name.toLowerCase())
      .setDescription(command.desc);

    await Promise.all(command.options.map(async option => {
      const loadOption = (o) => {
        o
          .setName(option.name)
          .setDescription(option.desc)
          .setRequired(option.required);
        if (option.choices) {
          option.choices.map(choice => {
            o.addChoice(choice.name, choice.value ?? choice.name);
          });
        }
        return o;
      }

      switch (option.type) {
        case 'text': case 'raw': case 'string': default:
          builder.addStringOption(loadOption);
          break;
        case 'integer':
          builder.addIntegerOption(loadOption);
          break;
        case 'number':
          builder.addNumberOption(loadOption);
          break;
        case 'boolean':
          builder.addBooleanOption(loadOption);
          break;
        case 'user': case 'member':
          builder.addUserOption(loadOption);
          break;
        case 'channel':
          builder.addChannelOption(loadOption);
          break;
        case 'role':
          builder.addRoleOption(loadOption);
          break;
        case 'mentionable':
          builder.addMentionableOption(loadOption);
          break;
      };
    }));

    return builder;
  }

  async buildCommands() {
    let commands = [];
    let addedSubs = [];

    await Promise.all(this.commandHandler.groups.map(async group => {
      let builder = new SlashCommandBuilder()
        .setName(group.name.toLowerCase())
        .setDescription(group.desc);
      let subGroups = this.commandHandler.subGroups.filter(sg => sg.group === group.name);
      let subCommands = this.commandHandler.commands.filter(c => c.group === group.name);

      await Promise.all(subGroups.map(async subGroup => {
        let subBuilder = new SlashCommandSubcommandGroupBuilder()
          .setName(subGroup.name.toLowerCase())
          .setDescription(subGroup.desc);
        await Promise.all(subCommands.map(async subCommand => {
          subBuilder.addSubcommand(await this.buildCommand(subCommand, true));
          addedSubs.push(subCommand.name);
        }));
        builder.addSubcommandGroup(subBUilder);
      }));

      await Promise.all(subCommands.map(async subCommand => {
        if (addedSubs.find(s => s === subCommand.name)) return;
        builder.addSubcommand(await this.buildCommand(subCommand, true));
        addedSubs.push(subCommand.name);
      }));

      commands.push(builder);
    }));

    await Promise.all(this.commandHandler.commands.map(async command => {
      if (addedSubs.find(s => s === command.name)) return;
      commands.push(await this.buildCommand(command));
    }));

    return commands;
  }

  async createPerms(guild, command) {
    
  }

  async refreshCommands(guild, commands) {
    const rest = new REST({ version: 9 })
      .setToken(TOKEN);
    const commandRoute = Routes.applicationGuildCommands(this.client.user.id, guild.id);
    const permRoute = Routes.guildApplicationCommandsPermissions(this.client.user.id, guild.id);
  
    // To avoid risk of duplicate commands (when altering command description),
    // all commands are cleared before new commands are added.
    await rest.put(commandRoute, { body: [] });
    const result = await rest.put(commandRoute, { body: commands });

    /*
    let perms = [];
    await Promise.all(result.map(async slashCommand => {
      const command = commands.find(c => c.name === slashCommand.name);
      perms.push({ id: slashCommand.id, permissions: await this.createPerms(guild, command) });
    }));

    await rest.put(permRoute, { body: perms });
    */
    return result;
  }

  async setupGuild(guild) {
    await this.refreshCommands(guild, await this.buildCommands()).catch(err => {
      console.error(`Unable to load slash commands to guild ${guild.id}: ${err}`);
    });
  }

  async findCommand(interaction) {
    let command = null;
    this.commandHandler.groups.map(group => {
      if (group.name.toLowerCase() !== interaction.commandName) return;
      const subName = interaction.options.getSubcommand(false);
      const subGroupName = interaction.options.getSubcommandGroup(false);
     
      if (subGroupName) {
        const subGroup = this.commandHandler.subGroups.find(sg => sg.name.toLowerCase() === subGroup);
        if (!subGroup) return;

        command = this.commandHandler.commands.find(c => {
          if (!c.subGroup) return;
          if (c.subName.toLowerCase() !== subName) return;
          if (c.subGroup.toLowerCase() !== subGroupName) return;
          return true;
        });
      }
      command = this.commandHandler.commands.find(c => c.groupMember && c.groupMember.toLowerCase() === subName);
    });
    return command ?? this.commandHandler.commands.find(c => c.name.toLowerCase() === interaction.commandName);
  }

  async executeCommand(command, ...params) {
    if (!command.slashRun && !command.run) return;
    return command.slashRun ? await command.slashRun(...params) : await command.run(...params);
  }

  async handleInteraction(interaction) {
    if (!interaction.isCommand()) return;
    const command = await this.findCommand(interaction);

    // Command execution requirements:
    // Command must support slash commands.
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
      return interaction.reply(warning(`\`${interaction.commandName}\` is not a valid command.`));
    }
    if (command.guildOnly && !interaction.guild) {
      return interaction.reply(denial('Guild-only commands cannot be run outside of a guild.'));
    }
    if (command.ownerOnly && (!interaction.guild || !interaction.user.id === interaction.guild.ownerID)) {
      return interaction.reply(denial('Owner-only commands can only be run by the owner.'));
    }
    if (command.nsfw && (!interaction.guild || !interaction.channel.nsfw)) {
      return interaction.reply(denial('NSFW commands can only be run in NSFW channels.'));
    }
    if (!await this.commandHandler.checkPerms(command.userPerms, interaction.member,
        interaction.channel instanceof GuildChannel && interaction.channel)) {
      return interaction.reply(denial('You do not have the permissions required by this command.'));
    }
    if (!await this.commandHandler.checkPerms(command.botPerms, interaction.guild.me,
        interaction.channel instanceof GuildChannel && interaction.channel)) {
      return interaction.reply(denial('I do not have the permissions required to run this command.'));
    }
    if ((this.validator && !await this.commandHandler.validator(interaction, command))
        || (command.validator && !await command.validator(interaction))) {
       return interaction.reply(denial('Command validation failed.'));
    }

    if (!interaction.client) interaction.client = this.client;
    this.executeCommand(command, this.client, interaction).catch(err => {
      console.error(`Unable to run ${command.name} command: ${err}`);
      interaction.reply(warning('An error occured during command execution.'));
    }).then(() => {
      this.emit('commandRun', interaction, command);
    });
  }

  load({ eventHandler, commandHandler }) {
    this.commandHandler = commandHandler;
    eventHandler.on('interactionCreate', this.handleInteraction.bind(this));

    commandHandler.on('commandsLoad', async () => {
      console.log('Setting up slash commands');
      eventHandler.on('guildCreate', this.setupGuild.bind(this));

      if (!this.client.isReady()) {
        await new Promise(res => this.client.on('ready', res));
      }
      this.client.guilds.cache.map(this.setupGuild.bind(this));
    });
  }

  constructor(client) {
    super({
      name: 'slashHandler',
      client: client
    });
  }
}