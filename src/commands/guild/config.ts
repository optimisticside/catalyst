// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import CatalystClient from 'core/client';
import { Permissions } from 'discord.js';
import Command, { CommandArgs, CommandGiven } from 'structs/command';
import OptionParser from 'utils/optionParser';
import ListMenu, { ListElement } from '@components/listMenu';
import * as Fluid from 'libs/fluid';

const PATH_DELIM = ':';

interface ConfigListItem {
  name: string;
  desc: string;
  buttonName?: string;
  emoji?: string;
  redirect?: Fluid.Component | ConfigList;
};

interface ConfigList {
  header: string;
  body: string;
  items: Array<ConfigListItem>;
};

export default class ConfigCommand extends Command {
  tree: ConfigList = {
    header: 'Catalyst',
    body: 'Configure Catalyst through the buttons below.',
    items: [
      {
        name: 'Guardian',
        desc: 'Automates moderation to maintain a safe environment.',
        redirect: {
          header: 'Guardian',
          body: 'Click the buttons below to configure Guardian.',
          items: [
            {
              name: 'Toggle',
              desc: 'Enable or disable Guardian.',
            },
            {
              name: 'Blacklist',
              desc: 'Automatically deletes messages that contain blacklisted words.',
            },
            {
              name: 'Antispam',
              desc: 'Automatically stop users who spam in the chat.'
            },
            {
              name: 'URL Filter',
              desc: 'Remove messages that contain URLs.'
            },
            {
              name: 'Invite Filter',
              desc: 'Remove messages that contain Discord Invites.'
            },
            {
              name: 'IP Filter',
              desc: 'Remove messages that contain IP addresses.'
            },
            {
              name: 'Zalgo Filter',
              desc: 'Remove messages that contain [zalgo](https://en.wikipedia.org/wiki/Zalgo_text)'
            }
          ]
        }
      },
      {
        name: 'Auto Message',
        desc: 'Automatically sends messages when something happens.',
        redirect: {
          header: 'Auto Message',
          body: 'Click the buttons below to configure auto-messaging.',
          items: [
            {
              name: 'Greeting',
              desc: 'Set a greeting for when people join the server.',
            },
            {
              name: 'Join DM',
              desc: 'Sends a DM when someone joins the server.'
            },
            {
              name: 'Goodbye',
              desc: 'Set a goodbye for when people leave the server.'
            }
          ]
        }
      },
      {
        name: 'Logs',
        desc: 'Keeps track of server activity.',
        redirect: {
          header: 'Logs',
          body: 'Click the buttons below to configure logging.',
          items: [
            {
              name: 'Toggle',
              desc: 'Enable or disable logging'
            },
            {
              name: 'Channel',
              desc: 'The channel where logs will be posted.'
            },
            {
              name: 'Message Logs',
              buttonName: 'Message',
              desc: 'Keep track of messages sent.',
              redirect: {
                header: 'Messsage Logs',
                body: 'Click the buttons below to configure message logging.',
                items: [
                  {
                    name: 'Message Delete',
                    buttonName: 'Delete',
                    desc: 'Keep track of when messages are deleted.'
                  },
                  {
                    name: 'Message Edit',
                    buttonName: 'Edit',
                    desc: 'Keep track of when messages are edited.'
                  }
                ]
              }
            },
            {
              name: 'Command Logs',

              desc: 'Keep track of when commands are run.'
            },
            {
              name: 'Guardian Logs',
              desc: 'Keep track of what Guardian does.'
            },
            {
              name: 'User Logs',
              desc: 'Keep track of users in the server',
              redirect: {
                header: 'User Logs',
                body: 'Click the buttons below to configure user logging.',
                items: [
                  {
                    name: 'User Join',
                    desc: 'Keep track of when users join the server.'
                  },
                  {
                    name: 'User Leave',
                    desc: 'Keep track of when users leave the server.'
                  }
                ]
              }
            }
          ]
        }
      },
      {
        name: 'Prefix',
        desc: 'Sets a custom prefix.'
      },
      {
        name: 'Auto Role',
        desc: 'Automatically assign roles to people that join.',
        redirect: {
          header: 'Auto Role',
          body: 'Click the buttons below to configure auto role-assignment.',
          items: [
            {
              name: 'Toggle',
              desc: 'Enable or disable auto roles'
            },
            {
              name: 'Roles',
              desc: 'The roles to give users when they join the server'
            }
          ]
        }
      }
    ]
  };

  makeTree(node: ConfigList) {
    const listBody: Array<ListElement> = node.items.map(({ name, buttonName, emoji, desc, redirect }) => {
      if (redirect && !(redirect instanceof Fluid.Component)) {
        redirect = this.makeTree(redirect);
      }
      return {
        name, desc, buttonName, emoji,
        action: redirect && (redirector => redirector(redirect as Fluid.Component))
      };
    });
    return new ListMenu({ header: node.header, desc: node.body, body: listBody });
  }

  findRoot(_path?: Array<string>) {
    let position = this.tree as ConfigList | ConfigListItem;
    /*path.map(child => {
      if (position.items !== undefined) {

      }
    });*/
    return position;
  }

  async run(_client: CatalystClient, given: CommandGiven, args: CommandArgs) {
    const parser = new OptionParser(this, given, args);
    const rawPath = await parser.getOption('path') as string | undefined;
    
    const pathElements = rawPath?.split(PATH_DELIM);
    let root = this.findRoot(pathElements);
    if (!root || (root as ConfigList).items === undefined) return;
    root = root as ConfigList;

    const uiRoot = this.makeTree(root);
    Fluid.mount(uiRoot, given, { time: 15_000 });
  }

  constructor() {
    super({
      name: 'config',
      desc: 'Allows you to configure all features of the bot',
      userPerms: [ Permissions.FLAGS.MANAGE_GUILD ],
      guildOnly: true,
      options: [
        {
          name: 'path',
          type: 'string',
          desc: `The specific setting to jump to (separated by \`${PATH_DELIM}\`s)`,
          prompt: 'What setting do you want to configure',
          required: false
        }
      ]
    });
  }
};