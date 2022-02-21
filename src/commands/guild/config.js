// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details
// This is legacy code and will be replaced soon

Object.defineProperty(exports, '__esModule', { value: true });
const tslib = require('tslib');
const { Permissions, MessageEmbed, Interaction } = require('discord.js');
const formatter = tslib.__importDefault(require('utils/formatter.js')).default;
const { NAME, DEFAULT_COLOR } = tslib.__importDefault(require('core/config.js')).default;
const Command = tslib.__importDefault(require('structs/command.js')).default;
const OptionParser = tslib.__importDefault(require('utils/optionParser.js')).default;
const Serializer = tslib.__importDefault(require('utils/serializer.js')).default;
const GuildData = tslib.__importDefault(require('models/guildData.js')).default;
const promisify =
  fn =>
  async (...given) =>
    fn(...given);
const { alert, success, warning, prompt, neutral, denial } = formatter('Config Command');

exports.default = class ConfigCommand extends Command {
  awaitCollection(collector) {
    return new Promise((resolve, reject) => {
      collector.on('collect', resolve);
      collector.on('end', reject);
    });
  }

  async promptBool(given, reply, title, desc, footer) {
    const embed = new MessageEmbed().setTitle(title).setColor(DEFAULT_COLOR).setDescription(desc).setFooter(footer);
    reply.reactions.removeAll();
    reply.edit({ embeds: [embed] });

    await reply.react('✅');
    await reply.react('❌');
    const filter = r => r.users.cache.find(u => u === given.author);
    const collector = reply.createReactionCollector({ filter, time: 30000 });
    const reaction = await this.awaitCollection(collector).catch(() => {
      reply.reply(warning('Timed out.'));
    });

    if (!reaction) return;
    if (reaction.emoji.name === '✅') return true;
    if (reaction.emoji.name === '❌') return false;
  }

  async promptString(given, reply, name, promptMessage, encoder) {
    reply.reactions.removeAll();
    reply.edit(prompt(promptMessage ?? `What would you like to set the ${name.toLowerCase()} to`, 'embed'));
    reply.react('❌');

    let exited = false;
    const reactionFilter = r => r.users.cache.find(u => u === given.author);
    const reactionCollector = reply.createReactionCollector({ filter: reactionFilter, time: 30000 });
    this.awaitCollection(reactionCollector)
      .then(reaction => {
        if (!reaction || reaction.emoji.name !== '❌') return;
        exited = true;
        reply.reactions.removeAll();
        reply.edit(neutral('Prompt has exited', 'embed'));
      })
      .catch(() => {
        // There is nothing to do here, since reacting
        // was optional.
      });

    const messageFilter = m => m.author === given.author;
    const messageCollector = reply.channel.createMessageCollector({ filter: messageFilter, time: 30000 });
    const message = await this.awaitCollection(messageCollector).catch(() => {
      if (exited) return;
      reply.reply(warning('Timed out.'));
    });

    if (exited || !message) return;
    let failed = false;
    const result = !encoder
      ? message.content
      : await encoder(message.content).catch(err => {
          failed = true;
        });
    if (failed) {
      reply.reactions.removeAll();
      reply.edit(alert(`Invalid ${name.toLowerCase()} provided`, 'embed'));
      return;
    }

    return result;
  }

  boolSetting(name, desc, key) {
    return async (client, given, reply) => {
      const config =
        (await GuildData.findOne({ id: given.guild.id })) ?? (await GuildData.create({ id: given.guild.id }));
      const current = config[key];
      const newDesc = current != null ? `${desc}\nIt is currently ${current === true ? 'on' : 'off'}` : desc;

      const answer = await this.promptBool(
        given,
        reply,
        name,
        newDesc,
        `Would you like to ${current === true ? 'disable' : 'enable'} it?`
      );
      if (answer === null) return;

      if (answer) {
        config[key] = !current;
        config.markModified(key);
        await config
          .save()
          .finally(() => reply.reactions.removeAll())
          .then(() => reply.edit(success(`Successfully ${current === true ? 'disabled' : 'enabled'} ${name}`, 'embed')))
          .catch(err => {
            this.logger.error(`Unable to write to database: ${err}`);
            reply.edit(alert(`Unable to change ${name}`, 'embed'));
          });
      } else {
        reply.reactions.removeAll();
        reply.edit(neutral(`${name} was not changed`, 'embed'));
      }
    };
  }

  stringSetting(name, desc, encoder, decoder, promptMessage, key) {
    return async (client, given, reply) => {
      const config =
        (await GuildData.findOne({ id: given.guild.id })) ?? (await GuildData.create({ id: given.guild.id }));
      let current = config[key];
      if (current && decoder) current = await decoder(current);
      const shouldContinue = await this.promptBool(
        given,
        reply,
        name,
        `${desc}\nThe current ${name.toLowerCase()} is ${current}`,
        'Would you like to change it?'
      );
      if (shouldContinue === null) return;

      if (!shouldContinue) {
        reply.reactions.removeAll();
        reply.edit(neutral(`The ${name.toLowerCase()} has not been changed`, 'embed'));
      } else {
        const answer = await this.promptString(given, reply, name, promptMessage, encoder);
        if (!answer) return;

        config[key] = answer;
        config.markModified(key);
        await config
          .save()
          .finally(() => reply.reactions.removeAll())
          .then(() => reply.edit(success('Successfully updated database', 'embed')))
          .catch(err => reply.edit(alert('Unable to update database', 'embed')));
      }
    };
  }

  listSetting(title, elementName, elementPlural, encoder, decoder, key) {
    return [
      {
        name: 'Add',
        desc: `Add a ${elementName} to the list.`,
        emoji: '✏️',
        handler: async (client, given, reply) => {
          const config =
            (await GuildData.findOne({ id: given.guild.id })) ?? (await GuildData.create({ id: given.guild.id }));
          const list = config[key];
          const answer = await this.promptString(
            given,
            reply,
            elementName,
            `What ${elementName} would you like to add`,
            encoder
          );
          if (!answer) return;

          if (list.find(e => e === answer)) {
            return reply.edit(warning(`That ${elementName} is already in the list`, 'embed'));
          }

          list.push(answer);
          config.markModified(key);
          await config
            .save()
            .finally(() => reply.reactions.removeAll())
            .then(() => reply.edit(success('Successfully updated database', 'embed')))
            .catch(err => reply.edit(alert('Unable to update database', 'embed')));
        }
      },
      {
        name: 'Remove',
        desc: `Remove a ${elementName} from the list.`,
        emoji: '🗑️',
        handler: async (client, given, reply) => {
          const config =
            (await GuildData.findOne({ id: given.guild.id })) ?? (await GuildData.create({ id: given.guild.id }));
          const list = config[key];
          const answer = await this.promptString(
            given,
            reply,
            'word',
            `What ${elementName} would you like to remove`,
            encoder
          );
          if (!answer) return;

          const index = list.findIndex(e => e === answer);
          if (index === -1) {
            return reply.edit(warning(`That ${elementName} is not in the list`, 'embed'));
          }

          list.splice(index, 1);
          config.markModified(key);
          await config
            .save()
            .finally(() => reply.reactions.removeAll())
            .then(() => reply.edit(success('Successfully updated database', 'embed')))
            .catch(err => reply.edit(alert('Unable to update database', 'embed')));
        }
      },
      {
        name: 'List',
        desc: `See the list of ${elementPlural} in your DMs.`,
        emoji: '👁️',
        handler: async (client, given, reply) => {
          const config =
            (await GuildData.findOne({ id: given.guild.id })) ?? (await GuildData.create({ id: given.guild.id }));
          const list = config[key];
          const data = await Promise.all(
            list.map(async e => {
              if (decoder) {
                e = await decoder(e);
              }
              return e;
            })
          );

          const embed = new MessageEmbed().setTitle(title).setColor(DEFAULT_COLOR).setDescription(data.join('\n'));

          const dmChannel = await given.author
            .createDM()
            .catch(err => reply.edit(alert('Unable to create DM', 'embed')));
          if (!dmChannel) return;
          await dmChannel
            .send({ embeds: [embed] })
            .finally(() => reply.reactions.removeAll())
            .then(() => reply.edit(success('Check your DMs', 'embed')))
            .catch(err => reply.edit(alert('Unable to send DM', 'embed')));
        }
      }
    ];
  }

  async loadMenu(client, given, reply, title, desc, settings) {
    const embed = new MessageEmbed().setTitle(title).setColor(DEFAULT_COLOR).setDescription(desc);

    settings.map(c => embed.addField(`${c.emoji} ${c.name}`, c.desc));
    const replyContent = { embeds: [embed] };
    if (reply) {
      reply.reactions.removeAll();
      await reply.edit(replyContent);
    } else {
      reply = await given.reply(replyContent);
    }

    settings.map(c => reply.react(`${c.emoji}`));
    reply.react('❌');

    const filter = r => r.users.cache.find(u => u === given.author);
    const collector = reply.createReactionCollector({ filter, time: 30000 });
    const reaction = await this.awaitCollection(collector).catch(() => {
      reply.reply(warning('Timed out.'));
    });

    if (!reaction) return;
    if (reaction.emoji.name === '❌') {
      reply.reactions.removeAll();
      return reply.edit(neutral('Prompt has exited', 'embed'));
    }

    const setting = settings.find(c => c.emoji === reaction.emoji.name);
    if (!setting) return;
    if (!setting.handler) {
      return await this.loadMenu(client, given, reply, setting.name, setting.menuDesc ?? setting.desc, setting.menu);
    }
    return setting.handler(client, given, reply);
  }

  async run(given, args) {
    const parser = new OptionParser(this, given, args);
    //const path = parser.getOption('path');

    /*if (path) { this.logger.info(path.split(PATH_DELIM))
      const elements = path.split(PATH_DELIM);
      let position = this.settings;
      elements.forEach(e => {
        if (!position || (!position.menu && position !== this.settings)) return;
        position = position.menu[e];
      });
      if (!position || !position.menu) return;
      await this.loadMenu(this.client, given, null, position.name,
        position.desc, position.menu);
    }*/

    if (given instanceof Interaction) {
      return given.reply(warning('The config command cannot be run as a slash command'));
    }

    return await this.loadMenu(
      this.client,
      given,
      null,
      NAME,
      `React with the corresponding emoji to configure ${NAME}.`,
      this.settings
    );
  }

  constructor(client) {
    super({
      client,
      name: 'config',
      desc: 'Lets you manage the guild configuration.',
      userPerms: [Permissions.FLAGS.MANAGE_GUILD],
      botPerms: [Permissions.FLAGS.SEND_MESSAGES],
      guildOnly: true,
      tags: ['guild']
    });

    this.settings = [
      {
        name: 'Guardian',
        desc: 'Automatically moderates users to keep a safe environment.',
        menuDesc: 'React with the corresponding emoji to configure Guardian.',
        emoji: '🔒',
        menu: [
          {
            name: 'Toggle',
            desc: 'Enable or disable Guardian.',
            emoji: '🔧',
            handler: this.boolSetting('Guardian', 'Guardian will automate moderation.', 'guardianEnabled')
          },
          {
            name: 'Blacklist',
            desc: 'Automatically deletes messages that contain blacklisted words.',
            menuDesc: 'React with the corresponding emoji to configure Guardian Blacklist.',
            emoji: '🚫',
            menu: this.listSetting(
              'Guardian Blacklist',
              'word',
              'words',
              async w => w.toLowerCase(),
              null,
              'blacklistedWords'
            )
          },
          {
            name: 'Antispam',
            desc: 'Automatically mute users who spam in the chat.',
            emoji: '🔨',
            handler: this.boolSetting(
              'Antispam',
              'Antispam will automatically mute users who spam in the chat.',
              'antiSpamEnabled'
            )
          },
          {
            name: 'URL Filter',
            desc: 'Remove messages that contain links.',
            emoji: '🌐',
            handler: this.boolSetting(
              'URL Filter',
              'URL Filter will remove messages that contain links.',
              'filterLinks'
            )
          },
          {
            name: 'Invite Filter',
            desc: 'Remove messages that contain a Discord invite.',
            emoji: '📧',
            handler: this.boolSetting(
              'Invite Filter',
              'Invite filter will remove messages that contain Discord invites.',
              'filterInvites'
            )
          },
          {
            name: 'IP Filter',
            desc: 'Removes messages that contain an IP address.',
            emoji: '❗',
            handler: this.boolSetting(
              'IP Filter',
              'IP filter will remove messages that contain IP addresses.',
              'filterIps'
            )
          },
          {
            name: 'Zalgo Filter',
            desc: 'Removes messages that contain zalgo.',
            emoji: '🗑️',
            handler: this.boolSetting(
              'Zalgo Filter',
              'Zalgo filter will remove messages that contain zalgo.',
              'filterZalgo'
            )
          }
          /*{
            name: 'Self-Bot Detector',
            desc: 'Bans users who have self-bots.',
            emoji: '🤖',
            handler: this.boolSetting('Self-Bot Detector', 'Self-bot detector will ban users who use self-bots.', 'filterSelfBots')
          }*/
        ]
      },
      {
        name: 'Auto Message',
        desc: 'Automatically sends messages when something happens.',
        menuDesc: 'React with the corresponding emoji to congfigure Auto Message',
        emoji: '✉️',
        menu: [
          {
            name: 'Greeting',
            desc: 'Set the greeting for when people join the server.',
            menuDesc: 'React with the corresponding emoji to configure greeting.',
            emoji: '👋',
            menu: [
              {
                name: 'Toggle',
                desc: 'Whether channel greeting will be enabled.',
                emoji: '🔧',
                handler: this.boolSetting(
                  'Greeting',
                  'Greeting will greet new users that join the server.',
                  'greetingEnabled'
                )
              },
              {
                name: 'Message',
                desc: 'The message that users will be greeted with.',
                emoji: '✉️',
                handler: this.stringSetting(
                  'Greeting Message',
                  'The greeting message is the message users will be greeted with.',
                  null,
                  null,
                  "How would you like to greet users? You can mention the user through {mention}, and access the user's name through `{user}`, the server name through `{guild}`, and the member count through `{count}`",
                  'greetingMessage'
                )
              },
              {
                name: 'Channel',
                desc: 'The channel that new users will be greeted on.',
                emoji: '#️⃣',
                handler: this.stringSetting(
                  'Greeting Channel',
                  'The greeting channel is the channel users will be greeted on.',
                  promisify(Serializer.deserializeChannel),
                  promisify(Serializer.serializeChannel),
                  null,
                  'greetingChannel'
                )
              }
            ]
          },
          {
            name: 'Join DM',
            desc: 'Sends a DM when someone joins the server.',
            menuDesc: 'React with the corresponding emoji to configure join DMs.',
            emoji: '📩',
            menu: [
              {
                name: 'Toggle',
                desc: 'Whether join DMs will be enabled.',
                emoji: '🔧',
                handler: this.boolSetting('Join DM', 'Join DMs will send new users a DM.', 'joinDmEnabled')
              },
              {
                name: 'Message',
                desc: 'The DM that users will be greeted with.',
                emoji: '✉️',
                handler: this.stringSetting(
                  'Join DM Message',
                  'This is the message users will be DMed with when they join.',
                  null,
                  null,
                  "How would you like to greet messages. You can mention the user through {mention}, and access the user's name through `{user}`, the server name through `{guild}`, and the member count through `{count}`",
                  'joinDmMessage'
                )
              }
            ]
          },
          {
            name: 'Goodbye',
            desc: 'Set the goodbye for when people leave the server.',
            menuDesc: 'React with the corresponding emoji to configure goodbye.',
            emoji: '🚪',
            menu: [
              {
                name: 'Toggle',
                desc: 'Whether goodbyes will be enabled.',
                emoji: '🔧',
                handler: this.boolSetting(
                  'Goodbye',
                  'Goodbye will say goodbye to users that leave the server.',
                  'goodbyeEnabled'
                )
              },
              {
                name: 'Message',
                desc: 'The message that users will be said goodbye with.',
                emoji: '✉️',
                handler: this.stringSetting(
                  'Goodbye Message',
                  'The goodbye message is how users will be said goodbye to.',
                  null,
                  null,
                  "How would you like to say goodbye to users? You can access the user's name through `{user}`, the server name through `{guild}`, and the member count through `{count}`",
                  'goodbyeMessage'
                )
              },
              {
                name: 'Channel',
                desc: 'The channel that new users will be said goodbye on.',
                emoji: '#️⃣',
                handler: this.stringSetting(
                  'Goodbye Channel',
                  'The goodbye channel is the channel where will be said goodbye to.',
                  promisify(Serializer.deserializeChannel),
                  promisify(Serializer.serializeChannel),
                  null,
                  'goodbyeChannel'
                )
              }
            ]
          }
        ]
      },
      {
        name: 'Logs',
        desc: 'Keeps track of user activity.',
        menuDesc: 'React with the corresponding emoji to configure logs',
        emoji: '🗒️',
        menu: [
          {
            name: 'Toggle',
            desc: 'Whether logging will be enabled.',
            emoji: '🔧',
            handler: this.boolSetting('Logs', 'Logs will keep track of user activity.', 'logsEnabled')
          },
          {
            name: 'Channel',
            desc: 'The channel in which logs will be posted.',
            emoji: '#️⃣',
            handler: this.stringSetting(
              'Log Channel',
              'The log channel is the channel where logs will be posted.',
              promisify(Serializer.deserializeChannel),
              promisify(Serializer.serializeChannel),
              null,
              'logChannel'
            )
          },
          {
            name: 'Message Logs',
            menuDesc: 'React with the corresponding emoji to configure message logs.',
            desc: 'Keeping track of messages.',
            emoji: '📬',
            menu: [
              {
                name: 'Message Delete',
                desc: 'Keeping track of when messages are deleted.',
                emoji: '🗑️',
                handler: this.boolSetting(
                  'Message Delete',
                  'Message deletes are whenever someone deletes a message.',
                  'logMessageDelete'
                )
              },
              {
                name: 'Message Edit',
                desc: 'Keeping track of when messages are edited.',
                emoji: '✏️',
                handler: this.boolSetting(
                  'Message Edit',
                  'Message edits are whenever someone edits a message.',
                  'logMessageEdit'
                )
              }
            ]
          },
          {
            name: 'Command Run',
            desc: 'Keeping track of when commands are run.',
            emoji: '💡',
            handler: this.boolSetting('Command Run', 'Command runs are whenever someone runs a command.', 'logCommands')
          },
          {
            name: 'Guardian Logs',
            desc: 'Keeping track of what Guardian does.',
            emoji: '🔒',
            handler: this.boolSetting(
              'Guardian Logs',
              'Guardian Logs are whenever Guardian does something.',
              'logGuardian'
            )
          },
          {
            name: 'User Logs',
            menuDesc: 'React with the corresponding emoji to configure user logs.',
            desc: 'Keeping track of users.',
            emoji: '🧑',
            menu: [
              {
                name: 'User Join',
                desc: 'Keeping track of when users join the server.',
                emoji: '📥',
                handler: this.boolSetting(
                  'User Join',
                  'User Joins are whenever someone joins the server.',
                  'logMemberJoin'
                )
              },
              {
                name: 'User Leave',
                desc: 'Keeping track of when users leave the server.',
                emoji: '📤',
                handler: this.boolSetting(
                  'User Leave',
                  'Message edits are whenever someone leaves the server.',
                  'logMemberLeave'
                )
              }
              /*{
                name: 'User Update',
                desc: 'Keeping track of when a user is updated.',
                emoji: '📝',
                handler: this.boolSetting('User Update', 'User updates are whenever a user is updated.', 'logMemberUpdate')
              }*/
            ]
          }
        ]
      },
      {
        name: 'Prefix',
        desc: 'Set a custom prefix.',
        emoji: '✨',
        handler: this.stringSetting('Prefix', 'You can set a custom prefix for this guild', null, null, null, 'prefix')
      },
      {
        name: 'Levels',
        desc: 'Reward people for being active.',
        menuDesc: 'Select the corresponding emoji to configure Leveling.',
        emoji: '📈',
        menu: [
          {
            name: 'Toggle',
            desc: 'Enable or disable level-up messages.',
            emoji: '🔧',
            handler: this.boolSetting(
              'Level-up Message',
              'Displayes messages when users level up.',
              'levelupMessageEnabled'
            )
          },
          {
            name: 'Message',
            desc: 'The message that users will be said goodbye with.',
            emoji: '✉️',
            handler: this.stringSetting(
              'Goodbye Message',
              'The message for when users level up.',
              null,
              null,
              "How would you like to to tell users they leveled up? You can mention the user's through `{mention}`, their level through `{level}`, and their xp through `{xp}`",
              'levelupMessage'
            )
          }
        ]
      },
      {
        name: 'Auto Role',
        desc: 'Automatically assign roles to people that join.',
        menuDesc: 'Select the corresponding emoji to configure Auto Role.',
        emoji: '🤖',
        menu: [
          {
            name: 'Toggle',
            desc: 'Enable or disable Auto Role.',
            emoji: '🔧',
            handler: this.boolSetting('Auto Role', 'Auto Role will automate role assignment.', 'autoRoleEnabled')
          },
          {
            name: 'Roles',
            desc: 'The roles that Auto Role will assign.',
            menuDesc: 'React with the corresponding emoji to configure roles.',
            emoji: '✏️',
            menu: this.listSetting(
              'Auto Role',
              'role',
              'roles',
              promisify(Serializer.deserializeRole),
              promisify(Serializer.serializeRole),
              'autoRoles'
            )
          }
        ]
      }
      /*
      {
        name: 'Reaction Roles',
        desc: 'Lets users assign themselves roles by reacting to a message.',
        menuDesc:' React with the corresponding emoji to configure Reacion Roles.',
        emoji: '🖌️',
        menu: [
          {
            name: 'Toggle',
            desc: 'Enable or disable Reaction Roles.',
            emoji: '🔧',
            handler: this.boolSetting('Reaction Roles', 'Reaction Roles will let users choose their own roles.', 'reactionRoleEnabled')
          },
          {
            name: 'Post',
            desc: 'Posts the reaction roles message.',
            emoji: '✅',
            handler: async (client, given, reply) => {
              const channelId = await this.promptString(given, reply, 'Channel', 'What channel should I post the message in?',
                promisify(Serializer.deserializeChannel));
              const channel = given.guild.channels.cache.get(channelId);
              if (!channel) return;

              const desc = await this.promptString(given, reply, 'Message', 'What should the message say?');
              if (!desc) return;

              const embed = new MessageEmbed()
                .setTitle('Reaction Roles')
                .setColor(DEFAULT_COLOR)
                .setDescription(desc);

              const message = await channel.send({ embeds: [ embed ] });
              const raw = await client.database.getGuild(given.guild.id, 'reactionRoles');
              const reactionRoles = JSON.parse(raw ?? '[]');

              await Promise.all(reactionRoles.map(rr => message.react(rr[1])));
              await client.database.setGuild(given.guild.id, 'reactionRolesMessage', message.id)
              .finally(() => reply.reactions.removeAll())
              .then(() => reply.edit(success('Successfully updated database', 'embed')))
              .catch(err => reply.edit(alert('Unable to update database', 'embed')));
            }
          },
          {
            name: 'Roles',
            desc: 'The roles that users will be able to give themselves.',
            menuDesc: 'React with the corresponding emoji to configure roles.',
            emoji: '📝',
            menu: this.listSetting('Reaction Roles', 'role', 'roles', promisify(Serializer.deserializeRole), promisify(Serializer.serializeRole), 'reactionRoles')
          }
        ]
      }
      */
    ];
  }
};
