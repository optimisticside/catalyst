// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import {
  ApplicationCommandOptionChoice,
  AutocompleteInteraction,
  CommandInteraction,
  Guild,
  GuildChannel,
  Interaction,
  TextChannel
} from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import config from 'core/config';
import formatter from 'utils/formatter';
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder
} from '@discordjs/builders';
import Module from 'structs/module';
import Command, { CommandArgs, CommandGiven, CommandValidator } from 'structs/command';
import CatalystClient from 'core/client';
import CommandModule from '@modules/commands';
import EventModule from '@modules/events';

const { TOKEN, CREATORS } = config;
const { warning, denial } = formatter('Slash Command Handler');

export default class SlashModule extends Module {
  validator?: CommandValidator;

  buildCommand(command: Command, isSubCommand?: boolean) {
    const builder = (isSubCommand ? new SlashCommandSubcommandBuilder() : new SlashCommandBuilder())
      .setName((isSubCommand && command.groupMember?.toLowerCase()) || command.name.toLowerCase())
      .setDescription(command.desc);
    //.setDefaultPermission(false);

    command.options.map(option => {
      const loadOption = o => {
        o.setName(option.name).setDescription(option.desc).setRequired(option.required);
        // .setAutocomplete() and .addChoice sometimes
        // do not exist when the option-type doesn't support it.
        if (option.autoComplete) {
          o.setAutocomplete(true);
        }
        if (option.choices) {
          option.choices.map((choice: ApplicationCommandOptionChoice) => {
            o.addChoice(choice.name, choice.value ?? choice.name);
          });
        }
        return o;
      };

      switch (option.type) {
        case 'text':
        case 'raw':
        case 'string':
        default:
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
        case 'user':
        case 'member':
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
      }
    });

    return builder;
  }

  buildCommands() {
    const commandHandler = this.client.getModule<CommandModule>('commandHandler');
    const commands: Array<SlashCommandBuilder> = [];
    const addedSubs: Array<string> = [];

    // TODO: Commands that are hidden should not be added
    commandHandler.groups.map(group => {
      const builder = new SlashCommandBuilder().setName(group.name.toLowerCase()).setDescription(group.desc);
      const subGroups = commandHandler.subGroups.filter(sg => sg.group === group.name);
      const subCommands = commandHandler.commands.filter(c => c.group === group.name);

      subGroups.map(subGroup => {
        const subBuilder = new SlashCommandSubcommandGroupBuilder()
          .setName(subGroup.name.toLowerCase())
          .setDescription(subGroup.desc);
        subCommands.map(subCommand => {
          subBuilder.addSubcommand(this.buildCommand(subCommand, true) as SlashCommandSubcommandBuilder);
          addedSubs.push(subCommand.name);
        });
        builder.addSubcommandGroup(subBuilder);
      });

      subCommands.map(subCommand => {
        if (addedSubs.find(s => s === subCommand.name)) return;
        builder.addSubcommand(this.buildCommand(subCommand, true) as SlashCommandSubcommandBuilder);
        addedSubs.push(subCommand.name);
      });

      commands.push(builder);
    });

    commandHandler.commands.map(command => {
      if (addedSubs.find(s => s === command.name)) return;
      commands.push(this.buildCommand(command) as SlashCommandBuilder);
    });

    return commands;
  }

  createPerms(guild: Guild, command: Command) {
    const perms: Array<{ id: string; type: 'ROLE' | 'USER'; permission: boolean }> = [];

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

  async refreshCommands(guild: Guild, commands: Array<SlashCommandBuilder>) {
    const rest = new REST({ version: '9' }).setToken(TOKEN);
    if (!this.client.user) return;
    const commandRoute = Routes.applicationGuildCommands(this.client.user.id, guild.id);
    // const permRoute = Routes.guildApplicationCommandsPermissions(this.client.user.id, guild.id);

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

  async setupGuild(guild: Guild) {
    await this.refreshCommands(guild, this.buildCommands()).catch(() => {
      // `refreshCommands` fails if the bot does not have permission
      // to create slash commands, so nothing needs to be done.
    });
  }

  findCommand(interaction: CommandInteraction | AutocompleteInteraction) {
    const commandHandler = this.client.getModule<CommandModule>('commandHandler');
    let command: Command | undefined = undefined;

    commandHandler.groups.map(group => {
      if (group.name.toLowerCase() !== interaction.commandName) return;
      const subName = interaction.options.getSubcommand(false);
      const subGroupName = interaction.options.getSubcommandGroup(false);

      if (subGroupName) {
        const subGroup = commandHandler.subGroups.find(sg => sg.name.toLowerCase() === subGroup);
        if (!subGroup) return;

        command = commandHandler.commands.find(c => {
          if (!c.subGroup) return;
          if (c.groupMember?.toLowerCase() !== subName) return;
          if (c.subGroup.toLowerCase() !== subGroupName) return;
          return true;
        });
      }
      command = commandHandler.commands.find(c => c.groupMember && c.groupMember.toLowerCase() === subName);
    });
    return command ?? commandHandler.commands.find(c => c.name.toLowerCase() === interaction.commandName);
  }

  async executeCommand(command: Command, ...params: [CommandGiven, CommandArgs]) {
    return await command.run(...params);
  }

  async handleCommand(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !(interaction.channel instanceof TextChannel)) return;
    const commandHandler = this.client.getModule<CommandModule>('commandHandler');
    const command = this.findCommand(interaction);
    const lastRun = command && (await commandHandler.getCooldown(interaction.user, command));
    const member = await interaction.guild?.members.fetch(interaction.user.id);

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
    if (command.ownerOnly && (!interaction.guild || interaction.user.id !== interaction.guild.ownerId)) {
      return interaction.reply(denial('Owner-only commands can only be run by the guild owner.'));
    }
    if (command.creatorOnly && !CREATORS.find(c => c === interaction.user.id)) {
      return interaction.reply(denial('Creator-only commands can only run by bot creators.'));
    }
    if (command.nsfw && (!interaction.guild || !interaction.channel?.nsfw)) {
      return interaction.reply(denial('NSFW commands can only be run in NSFW channels.'));
    }
    if (
      member &&
      !commandHandler.checkPerms(
        command.userPerms,
        member,
        interaction.channel instanceof GuildChannel ? interaction.channel : undefined
      )
    ) {
      return interaction.reply(denial('You do not have the permissions required by this command.'));
    }
    if (
      interaction.guild?.me &&
      !commandHandler.checkPerms(command.botPerms, interaction.guild.me, interaction.channel)
    ) {
      return interaction.reply(denial('I do not have the permissions required to run this command.'));
    }
    if (lastRun) {
      const deltaTime = Date.now() - lastRun;
      if (deltaTime <= command.cooldown) {
        const timeLeft = command.cooldown - deltaTime;
        return interaction.reply(
          denial(`You're on cooldown. Please wait ${Math.ceil(timeLeft / 1000)} seconds before trying again.`)
        );
      }
    }
    if (
      (this.validator && !(await this.validator(interaction, command))) ||
      (command.validate && !(await command.validate(interaction)))
    ) {
      return interaction.reply(denial('Command validation failed.'));
    }

    // if (!interaction.client) interaction.client = this.client;
    this.executeCommand(command, interaction, [])
      .then(() => {
        commandHandler.saveCooldown(interaction.user, command);
        this.emit('commandRun', interaction, command);

        // TODO: Since most commands do not await for their interaction response,
        // this sometimes replies before they get the chance to.
        // if (!interaction.replied && !interaction.deferred) {
        //   interaction.reply(success('The command completed execution.'));
        // }
      })
      .catch(err => {
        this.logger.error(`Unable to run ${command.name} command: ${err}`);
        interaction.reply(warning('An error occured during command execution.'));
      });
  }

  async handleAutocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.isAutocomplete()) return;
    const command = this.findCommand(interaction);
    if (!command) return;

    const focused = interaction.options.getFocused();
    if (typeof focused !== 'string') return;
    const option = command.options.find(o => o.name === focused && o.autoComplete);

    return option?.autoComplete && (await interaction.respond(await option.autoComplete(interaction)));
  }

  async handleInteraction(interaction: Interaction) {
    if (interaction.isCommand()) {
      return await this.handleCommand(interaction as CommandInteraction);
    }

    if (interaction.isAutocomplete()) {
      return await this.handleAutocomplete(interaction as AutocompleteInteraction);
    }
  }

  load() {
    const eventHandler = this.client.getModule<EventModule>('eventHandler');
    const commandHandler = this.client.getModule<CommandModule>('commandHandler');

    commandHandler.on('commandsLoad', async () => {
      this.logger.info('Setting up slash commands');
      eventHandler.on('guildCreate', this.setupGuild.bind(this));

      await this.client.waitForReady();
      this.client.guilds.cache.map(this.setupGuild.bind(this));

      // Waiting for the client to be ready before accepting interactions
      // prevents invalid-interaction errors.
      eventHandler.on('interactionCreate', this.handleInteraction.bind(this));
    });
  }

  constructor(client: CatalystClient) {
    super({
      name: 'slashHandler',
      client: client
    });
  }
}
