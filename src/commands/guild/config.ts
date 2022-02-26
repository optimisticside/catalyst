// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { Permissions } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
import OptionParser from 'utils/optionParser';
import * as Fluid from 'libs/fluid';
import config from 'core/config';
import ListComponent from '@components/listMenu';
import ConfirmationComponent from '@components/confirmation';
import GuildData, { GuildDocument } from 'models/guildData';
import NoteComponent from '@components/note';

const PATH_DELIM = ':';
const { NAME } = config;

export interface ConfigMenuItem {
  name: string;
  emoji?: string;
  description: string;
  redirect: ConfigMenu | Fluid.ActionCallback;
}

export interface ConfigMenu {
  title: string;
  description: string;
  items: Array<ConfigMenuItem>;
}

export default class ConfigCommand extends Command {
  root: ConfigMenu = {
    title: 'Configuration',
    description: `Select the buttons below to configure ${NAME}`,
    items: [
      {
        name: 'Guardian',
        emoji: '🔒',
        description: 'Automatically moderates your server',
        redirect: {
          title: 'Guardian',
          description: 'Select the buttons below to configure Guardian',
          items: [
            {
              name: 'Anti-spam',
              emoji: '🔨',
              description: 'Prevents users from spamming in the server',
              redirect: this.boolSetting('Anti-spam', 'antiSpamEnabled')
            }
          ]
        }
      },

      {
        name: 'Auto Message',
        emoji: '✉️',
        description: 'Automatically sends messages when something happens',
        redirect: {
          title: 'Auto Message',
          description: 'Select teh buttons below to configure Auto Messaging',
          items: [
            {
              name: 'Greeting',
              emoji: '👋',
              description: 'Greets people when they join the server',
              redirect: {
                title: 'Greeting',
                description: 'Select the buttons below to configure greetings',
                items: []
              }
            },

            {
              name: 'Goodbye',
              emoji: '🚪',
              description: 'Says goodbye when people leave the server',
              redirect: {
                title: 'Goodbye',
                description: 'Select the butons below to configure goodbyes',
                items: [
                  {
                    name: 'Toggle',
                    emoji: '⚙︎',
                    description: 'Enable/disable goodbye messages',
                    redirect: this.boolSetting('Goodbye Messages', 'goodbyeEnabled')
                  }
                ]
              }
            },

            {
              name: 'Join DM',
              emoji: '📬',
              description: 'Sends a DM when someone joins the server',
              redirect: {
                title: 'Join DM',
                description: 'Select the buttons below to configure Join DMs',
                items: []
              }
            }
          ]
        }
      },

      {
        name: 'Logs',
        emoji: '🗒️',
        description: "Notifies you of what's going on in the server",
        redirect: {
          title: 'Logs',
          description: 'Select the buttons below to configure logs',
          items: [
            {
              name: 'Message Logs',
              emoji: '📨',
              description: 'Keeps track of what happens to messages',
              redirect: {
                title: 'Message Logs',
                description: 'Select the buttons below to configure message logging',
                items: []
              }
            },

            {
              name: 'Guardian Logs',
              emoji: '🔒',
              description: 'Keeps track of what Guardian does',
              redirect: {
                title: 'Guardian Logs',
                description: 'Select the butons below to configure Guardia logging',
                items: []
              }
            },

            {
              name: 'User Logs',
              emoji: '🧑',
              description: 'Keeps track of what users are doing',
              redirect: {
                title: 'User Logs',
                description: 'Select the butons below to cnofigure user logging',
                items: []
              }
            }
          ]
        }
      },

      {
        name: 'Levels',
        emoji: '📈',
        description: 'Reward people for being active',
        redirect: {
          title: 'Levels',
          description: 'Select the buttons below to configure leveling',
          items: [
            {
              name: 'Toggle',
              emoji: '⚙︎',
              description: 'Enable/disable level-up messages',
              redirect: this.boolSetting('Level-up Messages', 'levelupMessageEnabled')
            }
          ]
        }
      }

      {
        name: 'Auto Role',
        emoji: '🤖',
        description: 'Automatically assigns users roles',
        redirect: {
          title: 'Auto Role',
          description: 'Select the buttons below to configure auto role assignment',
          items: []
        }
      }
    ]
  };

  configChanger(config: GuildDocument, index: string, value: any): Fluid.ActionCallback {
    return redirector => {
      config[index] = value;
      config.markModified(index);
      config.save()
        .then(() => {
          redirector(new NoteComponent({
            header: 'Success',
            body: ':white_check_mark: The change was successful.'
          }));
        })
        .catch(err => {
          this.logger.error(`Unable to save data: ${err}`);
          redirector(new NoteComponent({
            header: 'Uh oh!',
            body: 'An error occured and the change could not be made.'
          }));
        });
    };
  }

  boolSetting(name: string, index: string): Fluid.ActionCallback {
    return async (redirector, interaction) => {
      if (!interaction.guild) return;
      const config: GuildDocument = 
        (await GuildData.findOne({ id: interaction.guild.id })) ?? (await GuildData.create({ id: interaction.guild.id }));

      const confirmation = new ConfirmationComponent({
        header: name,
        body: `${name} is currently ${config[index] ? 'on' : 'off'}`,
        footer: `Would you like to ${config[index] ? 'disable' : 'enable'} it?`,
        ifYes: this.configChanger(config, index, !config[index]),
        ifNo: redirector => redirector(new NoteComponent({
          header: 'Not changed',
          body: `${name} has not been changed.`
        }))
      });

      redirector(confirmation);
    };
  }

  getRoot(path?: string) {
    let position = this.root;
    if (!path || path === '') return position;

    // We have to use a traditional for-loop to ensure
    // the path is parsed in order.
    for (const part of path.toLowerCase().split(PATH_DELIM)) {
      const child = position.items.find(i => i.name.toLowerCase() === part);
      if (!child || child.redirect instanceof Function) break;
      position = child.redirect;
    }

    return position;
  }

  render(root: ConfigMenu) {
    const list = new ListComponent({
      header: root.title,
      description: root.description,
      body: []
    });

    root.items.map(({ name, description, emoji, redirect }) => {
      const action: Fluid.ActionCallback =
        redirect instanceof Function ? redirect : redirector => redirector(this.render(redirect));
      list.addElement({ name, description, emoji, action });
    });

    return list;
  }

  async run(given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const path = parser.getOption('path') as string;

    const root = this.getRoot(path);
    const tree = this.render(root);
    Fluid.mount(tree, given);
  }

  constructor(client: CatalystClient) {
    super({
      client,
      name: 'config',
      desc: 'Lets you manage the guild configuration.',
      userPerms: [Permissions.FLAGS.MANAGE_GUILD],
      botPerms: [Permissions.FLAGS.SEND_MESSAGES],
      tags: ['guild'],
      guildOnly: true,
      passive: false,
      options: [
        {
          name: 'path',
          type: 'string',
          desc: 'The path to the setting you want to change.',
          prompt: 'Where setting do you want to change?',
          required: false
        }
      ]
    });
  }
}