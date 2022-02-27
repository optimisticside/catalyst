// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { MessageEmbed, Permissions } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import CatalystClient from 'core/client';
import OptionParser from 'utils/optionParser';
import * as Fluid from 'libs/fluid';
import config from 'core/config';
import ListComponent from '@components/listMenu';
import ConfirmationComponent from '@components/confirmation';
import GuildData, { GuildDocument } from 'models/guildData';
import NoteComponent from '@components/note';
import PromptComponent from '@components/prompt';

const PATH_DELIM = ':';
const { NAME } = config;

export type Encoder<T> = (data: T) => Promise<string> | string;
export type Decoder<T> = (data: string) => Promise<T> | T;

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
              name: 'Blacklist',
              emoji: '📝',
              description: 'Removes messages that contain blacklisted words',
              redirect: this.listSetting('Blacklist', 'Words that are banned in the server', 'blacklistedWords')
            },
            {
              name: 'Anti-spam',
              emoji: '🔨',
              description: 'Prevents users from spamming in the server',
              redirect: this.boolSetting('Anti-spam', 'antiSpamEnabled')
            },
            {
              name: 'Message Filters',
              emoji: '🔍',
              description: 'Filters messages that contain blocked content',
              redirect: {
                title: 'Message Filters',
                description: 'Select the buttons below to configure message filtering',
                items: [
                  {
                    name: 'URL Filter',
                    emoji: '🌐',
                    description: 'Removes messages that contain URLs',
                    redirect: this.boolSetting('URL Filter', 'filterLinks')
                  },

                  {
                    name: 'Invite Filter',
                    emoji: '📧',
                    description: 'Removes messages that contain a Discord invite.',
                    redirect: this.boolSetting('Invite Filter', 'filterInvites')
                  },

                  {
                    name: 'IP Filter',
                    emoji: '❗',
                    description: 'Removes messages that contain an IP address.',
                    redirect: this.boolSetting('IP Filter', 'filterIps')
                  },

                  {
                    name: 'Zalgo Filter',
                    emoji: '🗑️',
                    description: 'Removes messages that contain zalgo.',
                    redirect: this.boolSetting('Zalgo Filter', 'filterZalgo')
                  }
                ]
              }
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
                items: [
                  {
                    name: 'Toggle',
                    emoji: '⚙️',
                    description: 'Enable/disable greeting messages',
                    redirect: this.boolSetting('Gretting Messages', 'greetingEnabled')
                  },

                  {
                    name: 'Message',
                    emoji: '✉️',
                    description: 'Change the greeting message',
                    redirect: this.dataSetting<string>('Greeting Message', 'greetingMessage')
                  }
                ]
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
                    emoji: '⚙️',
                    description: 'Enable/disable goodbye messages',
                    redirect: this.boolSetting('Goodbye Messages', 'goodbyeEnabled')
                  },

                  {
                    name: 'Message',
                    emoji: '✉️',
                    description: 'Change the goodbye message',
                    redirect: this.dataSetting<string>('Goodbye Message', 'goodbyeMessage')
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
                items: [
                  {
                    name: 'Toggle',
                    emoji: '⚙️',
                    description: 'Enable/disable join DMs',
                    redirect: this.boolSetting('Join DMs', 'joinDmEnabled')
                  },

                  {
                    name: 'Message',
                    emoji: '✉️',
                    description: 'Change the goodbye message',
                    redirect: this.dataSetting<string>('Join DM Message', 'joinDmMessage')
                  }
                ]
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
                items: [
                  {
                    name: 'Message Deletes',
                    emoji: '🗑️',
                    description: 'Keep track of deleted messages',
                    redirect: this.boolSetting('Delete Logs', 'logMessageDelete')
                  },

                  {
                    name: 'Message Edits',
                    emoji: '✏️',
                    description: 'Keep track of edited messages',
                    redirect: this.boolSetting('Edit Logs', 'logMessageEdit')
                  }
                ]
              }
            },

            {
              name: 'Guardian Logs',
              emoji: '🔒',
              description: 'Keeps track of what Guardian does',
              redirect: this.boolSetting('Guardian Logs', 'logGuardian')
            },

            {
              name: 'User Logs',
              emoji: '🧑',
              description: 'Keeps track of what users are doing',
              redirect: {
                title: 'User Logs',
                description: 'Select the butons below to cnofigure user logging',
                items: [
                  {
                    name: 'User Join',
                    emoji: '📥',
                    description: 'Keep track of users joining the server',
                    redirect: this.boolSetting('Join Logs', 'logMemberJoin')
                  },

                  {
                    name: 'User Leave',
                    emoji: '📤',
                    description: 'Keep track of users leaving the server',
                    redirect: this.boolSetting('Leave Logs', 'logMemberLeave')
                  }
                ]
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
              emoji: '⚙️',
              description: 'Enable/disable level-up messages',
              redirect: this.boolSetting('Level-up Messages', 'levelupMessageEnabled')
            },

            {
              name: 'Message',
              emoji: '✉️',
              description: 'Change the level-up message',
              redirect: this.dataSetting<string>('Level-up Message', 'levelupMessage')
            }
          ]
        }
      },

      {
        name: 'Auto Role',
        emoji: '🤖',
        description: 'Automatically assigns users roles',
        redirect: {
          title: 'Auto Role',
          description: 'Select the buttons below to configure auto role assignment',
          items: [
            {
              name: 'Toggle',
              emoji: '⚙️',
              description: 'Enable/disable auto roles',
              redirect: this.boolSetting('Auto role-assignment', 'autoRoleEnabled')
            }
          ]
        }
      }
    ]
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configChanger(config: GuildDocument, index: string, value: any): Fluid.ActionCallback {
    return redirector => {
      config[index] = value;
      config.markModified(index);
      config
        .save()
        .then(() => {
          redirector(
            new NoteComponent({
              header: 'Success',
              body: ':white_check_mark: The change was successful.',
              previousFreeze: true,
              backButton: true
            })
          );
        })
        .catch(err => {
          this.logger.error(`Unable to save data: ${err}`);
          redirector(
            new NoteComponent({
              header: 'Uh oh!',
              body: 'An error occured and the change could not be made.',
              previousFreeze: true,
              backButton: true
            })
          );
        });
    };
  }

  listSetting<T>(title: string, description: string, index: string, encoder?: Encoder<T>, decoder?: Decoder<T>): ConfigMenu {
    return {
      title,
      description,
      items: [
        {
          name: 'Add',
          emoji: '✏️',
          description: 'Add an item to the list',
          redirect: redirector => {
            const prompt = new PromptComponent({
              header: 'Item add prompt',
              body: 'Enter the item you would like to add to the list',
              onEnd: redirector =>
                redirector(
                  new NoteComponent({
                    header: 'List not changed',
                    body: `${title} has not been changed`,
                    previousFreeze: true,
                    backButton: true
                  })
                ),
              onCollect: async (collected, redirector, interaction) => {
                if (!interaction.guild) return;
                const config: GuildDocument =
                  (await GuildData.findOne({ id: interaction.guild.id })) ??
                  (await GuildData.create({ id: interaction.guild.id }));

                const decoded = decoder ? await decoder(collected) : collected;
                if (decoded === undefined) {
                  return redirector(
                    new NoteComponent({
                      header: 'Invalid value',
                      body: 'The value you entered is not valid',
                      previousFreeze: true,
                      backButton: true
                    })
                  );
                }

                if (config[index].includes(decoded)) {
                  return redirector(
                    new NoteComponent({
                      header: 'Already in list',
                      body: 'The value you entered is already in the list',
                      previousFreeze: true,
                      backButton: true
                    })
                  );
                }

                const changed = [...config[index], decoded];
                const actionCallback = this.configChanger(config, index, changed);
                actionCallback(redirector, interaction);
              }
            });

            redirector(prompt);
          }
        },

        {
          name: 'Remove',
          emoji: '🗑️',
          description: 'Remove an item from the list',
          redirect: redirector => {
            const prompt = new PromptComponent({
              header: 'Item delete prompt',
              body: 'Enter the item you would like to delete from the list',
              onEnd: redirector =>
                redirector(
                  new NoteComponent({
                    header: 'List not changed',
                    body: `${title} has not been changed`,
                    previousFreeze: true,
                    backButton: true
                  })
                ),
              onCollect: async (collected, redirector, interaction) => {
                if (!interaction.guild) return;
                const config: GuildDocument =
                  (await GuildData.findOne({ id: interaction.guild.id })) ??
                  (await GuildData.create({ id: interaction.guild.id }));
                
                const decoded = decoder ? await decoder(collected) : collected;
                if (decoded === undefined) {
                  return redirector(
                    new NoteComponent({
                      header: 'Invalid value',
                      body: 'The value you entered is not valid',
                      previousFreeze: true,
                      backButton: true
                    })
                  );
                }

                if (!config[index].includes(decoded)) {
                  return redirector(
                    new NoteComponent({
                      header: 'Not in list',
                      body: 'The value you entered is not in the list',
                      previousFreeze: true,
                      backButton: true
                    })
                  );
                }

                const changed = [...config[index]].filter(x => x !== decoded);
                const actionCallback = this.configChanger(config, index, changed);
                actionCallback(redirector, interaction);
              }
            });

            redirector(prompt);
          }
        },

        {
          name: 'View',
          emoji: '👁️',
          description: 'View the contents of the list',
          redirect: async (redirector, interaction) => {
            if (!interaction.guild) return;
            const config: GuildDocument =
              (await GuildData.findOne({ id: interaction.guild.id })) ??
              (await GuildData.create({ id: interaction.guild.id }));
            
            const channel = await interaction.user.createDM();
            const embed = new MessageEmbed()
              .setTitle(title)
              .setDescription(config[index].join('\n')); // TODO: use encoder.

            await channel.send({ embeds: [embed] })
            redirector(
              new NoteComponent({
                header: 'Success',
                body: "We've DMed you the list",
                previousFreeze: true,
                backButton: true
              })
            );
          }
        }
      ]
    }
  }

  dataSetting<T>(name: string, index: string, encoder?: Encoder<T>, decoder?: Decoder<T>): Fluid.ActionCallback {
    return async (redirector, interaction) => {
      if (!interaction.guild) return;

      const config: GuildDocument =
        (await GuildData.findOne({ id: interaction.guild.id })) ??
        (await GuildData.create({ id: interaction.guild.id }));

      const notChanged = new NoteComponent({
        header: 'Setting not changed',
        body: `${name} has not been changed`,
        previousFreeze: true,
        backButton: true
      });

      const confirmation = new ConfirmationComponent({
        header: name,
        body: `${name} is currently ${
          encoder ? await encoder(config[index]) : config[index]
        }. Would you like to change it?`,
        ifNo: redirector => redirector(notChanged),
        ifYes: redirector => {
          const prompt = new PromptComponent({
            header: 'Setting change prompt',
            body: `Enter the new value of ${name}`,
            onEnd: redirector => redirector(notChanged),
            onCollect: async (collected, redirector, interaction) => {
              const decoded = decoder ? await decoder(collected) : collected;
              if (decoded !== undefined) {
                const actionCallback = this.configChanger(config, index, decoded);
                actionCallback(redirector, interaction);
              } else {
                redirector(
                  new NoteComponent({
                    header: 'Invalid value',
                    body: 'The value you entered is not valid',
                    previousFreeze: true,
                    backButton: true
                  })
                );
              }
            }
          });

          redirector(prompt);
        }
      });

      redirector(confirmation);
    };
  }

  boolSetting(name: string, index: string): Fluid.ActionCallback {
    return async (redirector, interaction) => {
      if (!interaction.guild) return;
      const config: GuildDocument =
        (await GuildData.findOne({ id: interaction.guild.id })) ??
        (await GuildData.create({ id: interaction.guild.id }));

      const confirmation = new ConfirmationComponent({
        header: name,
        body: `${name} is currently ${config[index] ? 'on' : 'off'}`,
        footer: `Would you like to ${config[index] ? 'disable' : 'enable'} it?`,
        ifYes: this.configChanger(config, index, !config[index]),
        ifNo: redirector =>
          redirector(
            new NoteComponent({
              header: 'Not changed',
              body: `${name} has not been changed.`,
              previousFreeze: true,
              backButton: true
            })
          )
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
