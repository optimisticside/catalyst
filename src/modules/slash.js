// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { GuildChannel } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { TOKEN, CREATORS } = require('../util/configParser.js');
const { warning, denial, success, prompt } = require('../util/formatter.js')('Slash Command Handler');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } = require('@discordjs/builders');
const Module = require('../structs/module.js');

module.exports = class SlashModule extends Module {
  async buildCommand(command, isSubCommand) {
    const builder = (isSubCommand ? new SlashCommandSubcommandBuilder() : new SlashCommandBuilder())
      .setName(isSubCommand ? command.groupMember?.toLowerCase() : command.name.toLowerCase())
      .setDescription(command.desc);
      //.setDefaultPermission(false);

    await Promise.all(command.options.map(async option => {
      const loadOption = (o) => {
        o
          .setName(option.name)
          .setDescription(option.desc)
          .setRequired(option.required);
        // .setAutocomplete() and .addChoice sometimes
        // do not exist when the option-type doesn't support it.
        if (option.autoComplete) {
          o.setAutocomplete(true);
        }
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
    const commands = [];
    const addedSubs = [];

    await Promise.all(this.commandHandler.groups.map(async group => {
      const builder = new SlashCommandBuilder()
        .setName(group.name.toLowerCase())
        .setDescription(group.desc);
      const subGroups = this.commandHandler.subGroups.filter(sg => sg.group === group.name);
      const subCommands = this.commandHandler.commands.filter(c => c.group === group.name);

      await Promise.all(subGroups.map(async subGroup => {
        const subBuilder = new SlashCommandSubcommandGroupBuilder()
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
    const perms = [];

    guild.roles.cache.map(role => {
      const missing = command.userPerms.filter(p => !role.permissions.has(p));
      if (missing !== []) return;
      perms.push({ id: role.id, type: 'ROLE', permission: true });
    });

    guild.members.cache.map(member => {
      // We only want to add the user if they are not
      // in any of the roles already addded but still have perms.
      const sameRoles = perms.filter(r => member.roles.cache.get(r.id));
      if (sameRoles !== []) return;
      const missing = command.userPerms.filter(p => !member.permissions.has(p));
      if (missing !== []) return;
      perms.push({ id: member.user.id, type: 'USER', permission: true });
    });

    return perms;
  }

  async refreshCommands(guild, commands) {
    const rest = new REST({ version: 9 })
      .setToken(TOKEN);
    const commandRoute = Routes.applicationGuildCommands(this.client.user.id, guild.id);
    const permRoute = Routes.guildApplicationCommandsPermissions(this.client.user.id, guild.id);
  
    // To avoid risk of duplicate commands (when altering command description),
    // all commands are cleared before new commands are added.
    // Edit: Upon further thought, I've realized how horrible
    // of an idea this is.
    // await rest.put(commandRoute, { body: [] });
    const result = await rest.put(commandRoute, { body: commands });

    /*
    const perms = [];
    await Promise.all(this.f(async command => {
      const slashCommand = await this.findSlashCommand(command, commands);
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

  async handleCommand(interaction) {
    if (!interaction.isCommand()) return;
    const command = await this.findCommand(interaction);
    const lastRun = await this.commandHandler.getCooldown(interaction.user, command);

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
      return interaction.reply(denial('Owner-only commands can only be run by the guild owner.'));
    }
    if (command.creatorOnly && !CREATORS.find(c => c === message.author.id)) {
      return message.reply(denial('Creator-only commands can only run by bot creators.'));
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
    if (lastRun) {
      const deltaTime = Date.now() - lastRun;
      if (deltaTime <= command.cooldown) {
        const timeLeft = command.cooldown - deltaTime;
        return interaction.reply(denial(`You're on cooldown. Please wait ${Math.ceil(timeLeft / 1000)} seconds before trying again.`));
      }
    }
    if ((this.validator && !await this.commandHandler.validator(interaction, command))
        || (command.validator && !await command.validator(interaction))) {
       return interaction.reply(denial('Command validation failed.'));
    }

    if (!interaction.client) interaction.client = this.client;
    this.executeCommand(command, this.client, interaction)
      .then(() => {
        this.commandHandler.saveCooldown(interaction.user, command);
        this.emit('commandRun', interaction, command);
        if (!interaction.replied) {
          // This will be the default intearction reply message,
          // for when the command does not reply.
          interaction.reply(success('The command completed execution.'));
        }
      })
      .catch(err => {
        console.error(`Unable to run ${command.name} command: ${err}`);
        interaction.reply(warning('An error occured during command execution.'));
    });
  }

  async handleAutocomplete(interaction) {
    if (!interaction.isAutocomplete()) return;
    const command = await this.findCommand(interaction);
    if (!command) return;

    const options = command.options.filter(o => o.autoComplete);
    const result = await Promise.all(options.map(async o => {
      const current = interaction.options.get(o.name);
      const value = await o.autoComplete(current);
      return { name: o.name, value };
    }));
    
    return await interaction.respond(result);
  }

  async handleInteraction(interaction) {
    if (interaction.isCommand()) {
      return await this.handleCommand(interaction);
    }

    if (interaction.isAutocomplete()) {
      return await this.handleAutocomplete(interaction);
    }
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