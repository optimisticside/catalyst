// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const PATH_DELIM = ':';
const { Permissions, MessageEmbed, Interaction } = require('discord.js');
const { alert, success, warning, prompt, neutral, denial } = require('../../util/formatter.js')('Set-Prefix Command');
const { NAME, DEFAULT_COLOR } = require('../../config.json');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');
const emojiRegex = require('emoji-regex');
const Serializer = require('../../util/serializer.js');
const promisify = (fn) => async (...given) => await fn(...given);

module.exports = class ConfigCommand extends Command {
  awaitCollection(collector) {
    return new Promise((resolve, reject) => {
      collector.on('collect', resolve);
      collector.on('end', reject);
    });
  }

  async promptBool(given, reply, title, desc, footer) {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setColor(DEFAULT_COLOR)
      .setDescription(desc)
      .setFooter(footer);
    reply.reactions.removeAll();
    reply.edit({ embeds: [ embed ] });

    await reply.react('✅');
    await reply.react('❌');
    const filter = r => r.users.cache.find(u => u === given.author);
    const collector = reply.createReactionCollector({ filter, time: 30000,  })
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

    const filter = m => m.author === given.author;
    const collector = reply.channel.createMessageCollector({ filter, time: 30000 });
    const message = await this.awaitCollection(collector).catch(() => {
      reply.reply(warning('Timed out.'));
    });

    if (!message) return;
    let failed = false;
    const result = !encoder ? message.content : await encoder(message.content).catch(err => {
      failed = true;
    });
    if (failed) {
      reply.reactions.removeAll();
      reply.edit(alert(`Invalid ${name.toLowerCase()} provided`, 'embed'));
      return;
    }

    return result;
  }

  boolSetting(name, desc, ...key) {
    return async (client, given, reply) => {
      const current = JSON.parse(await client.database.getGuild(given.guild.id, ...key));
      const newDesc = current != null ? `${desc}\nIt is currently ${current === true ? 'on' : 'off'}` : desc;

      const answer = await this.promptBool(given, reply, name, newDesc, `Would you like to ${current === true ? 'disable' : 'enable'} it?`);
      if (answer === null) return;

      if (answer) {
        await client.database.setGuild(given.guild.id, ...key, !current)
          .finally(() => reply.reactions.removeAll())
          .then(() => reply.edit(success(`Successfully ${current === true ? 'disabled' : 'enabled'} ${name}`, 'embed')))
          .catch(err => {
            console.log(`Unable to write to database: ${err}`);
            reply.edit(alert(`Unable to change ${name}`, 'embed'));
          });
      } else {
          reply.reactions.removeAll();
          reply.edit(neutral(`${name} was not changed`, 'embed'));
      }
    }
  }

  stringSetting(name, desc, encoder, decoder, promptMessage, ...key) {
    return async (client, given, reply) => {
      let current = await client.database.getGuild(given.guild.id, ...key);
      if (current && decoder) current = await decoder(current);
      const shouldContinue = await this.promptBool(given, reply, name, `${desc}\nThe current ${name.toLowerCase()} is ${current}`,
        'Would you like to change it?');
      if (shouldContinue === null) return;

      if (!shouldContinue) {
        reply.reactions.removeAll();
        reply.edit(neutral(`The ${name.toLowerCase()} has not been changed`, 'embed'));
      } else {
        const answer = await this.promptString(given, reply, name, promptMessage, encoder);
        if (!answer) return;

        await client.database.setGuild(given.guild.id, ...key, answer)
          .finally(() => reply.reactions.removeAll())
          .then(() => reply.edit(success('Successfully updated database', 'embed')))
          .catch(err => reply.edit(alert('Unable to update database', 'embed')));
      }
    }
  }

  listSetting(title, elementName, elementPlural, encoder, decoder, ...key) {
    return [
      {
        name: 'Add',
        desc: `Add a ${elementName} to the list.`,
        emoji: '✏️',
        handler: async (client, given, reply) => {
          const raw = await client.database.getGuild(given.guild.id, ...key) || '[]';
          const list = JSON.parse(raw);
          const answer = await this.promptString(given, reply, elementName, `What ${elementName} would you like to add`, encoder);
          if (!answer) return;

          if (list.find(e => e === answer)) {
            return reply.edit(warning(`That ${elementName} is already in the list`, 'embed'))
          }

          list.push(answer);
          const json = JSON.stringify(list)
          await client.database.setGuild(given.guild.id, ...key, json)
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
          const raw = await client.database.getGuild(given.guild.id, ...key) || '[]';
          const list = JSON.parse(raw);
          const answer = await this.promptString(given, reply, 'word', `What ${elementName} would you like to remove`, encoder);
          if (!answer) return;

          const index = list.findIndex(e => e === answer);
          if (index === -1) {
            return reply.edit(warning(`That ${elementName} is not in the list`, 'embed'))
          }

          list.splice(index, 1);
          const json = JSON.stringify(list);
          await client.database.setGuild(given.guild.id, ...key, json)
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
          const raw = await client.database.getGuild(given.guild.id, ...key) || '[]';
          const list = JSON.parse(raw);
          const data = await Promise.all(list.map(async e => {
            if (decoder) {
              e = await decoder(e);
            }
            return e;
          }));

          const embed = new MessageEmbed()
            .setTitle(title)
            .setColor(DEFAULT_COLOR)
            .setDescription(data.join('\n'));

          const dmChannel = await given.author.createDM()
            .catch(err => reply.edit(alert('Unable to create DM', 'embed')));
          if (!dmChannel) return;
          await dmChannel.send({ embeds: [ embed ] })
            .finally(() => reply.reactions.removeAll())
            .then(() => reply.edit(success('Check your DMs', 'embed')))
            .catch(err => reply.edit(alert('Unable to send DM', 'embed')));
        }
      }
    ]
  }

  async loadMenu(client, given, reply, title, desc, settings) {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setColor(DEFAULT_COLOR)
      .setDescription(desc);

    settings.map(c => embed.addField(`${c.emoji} ${c.name}`, c.desc));
    const replyContent = { embeds: [ embed ] };
    if (reply) {
      reply.reactions.removeAll();
      await reply.edit(replyContent);
    } else {
      reply = await given.reply(replyContent);
    }

    settings.map(c => reply.react(`${c.emoji}`));
    const filter = r => r.users.cache.find(u => u === given.author);
    const collector = reply.createReactionCollector({ filter, time: 30000 });
    const reaction = await this.awaitCollection(collector).catch(() => {
      reply.reply(warning('Timed out.'));
    });

    if (!reaction) return;
    const setting = settings.find(c => c.emoji === reaction.emoji.name);
    if (!setting) return;
    if (!setting.handler) {
      return await this.loadMenu(client, given, reply, setting.name, setting.menuDesc ?? setting.desc, setting.menu);
    }
    return setting.handler(client, given, reply)
  }

  async run(client, given, args) {
    const parser = new OptionParser(this, given, args);
    //const path = await parser.getOption('path');

    /*if (path) { console.log(path.split(PATH_DELIM))
      const elements = path.split(PATH_DELIM);
      let position = this.settings;
      elements.forEach(e => {
        if (!position || (!position.menu && position !== this.settings)) return;
        position = position.menu[e];
      });
      if (!position || !position.menu) return;
      await this.loadMenu(client, given, null, position.name,
        position.desc, position.menu);
    }*/

    if (given instanceof Interaction) {
      return given.reply(warning('The config command cannot be run as a slash command'));
    }

    return await this.loadMenu(client, given, null, NAME,
      `React with the corresponding emoji to configure ${NAME}.`, this.settings);
  }

  constructor() {
    super({
      name: 'config',
      desc: 'Lets you manage the guild configuration.',
      userPerms: [ Permissions.FLAGS.MANAGE_GUILD ],
      botPerms: [ Permissions.FLAGS.SEND_MESSAGES ],
      guildOnly: true,
      tags: [ 'guild' ],
      options: [
        /*{
          name: 'path',
          type: 'string',
          desc: 'The setting you want to configure (split by colons)',
          prompt: 'What path do you want to configure?',
          required: false
        }*/
      ]
    })

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
            handler: this.boolSetting('Guardian', 'Guardian will automate moderation.', 'guardian')
          },
          {
            name: 'Blacklist',
            desc: 'Automatically deletes messages that contain blacklisted words.',
            menuDesc: 'React with the corresponding emoji to configure Guardian Blacklist.',
            emoji: '🚫',
            menu: this.listSetting('Guardian Blacklist', 'word', 'words', async w => w.toLowerCase(), null, 'blacklistedWords')
          },
          {
            name: 'Antispam',
            desc: 'Automatically mute users who spam in the chat.',
            emoji: '🔨',
            handler: this.boolSetting('Antispam', 'Antispam will automatically mute users who spam in the chat.', 'antiSpam')
          },
          {
            name: 'URL Filter',
            desc: 'Remove messages that contain links.',
            emoji: '🌐',
            handler: this.boolSetting('URL Filter', 'URL Filter will remove messages that contain links.', 'blockLinks')
          },
          {
            name: 'Invite Filter',
            desc: 'Remove messages that contain a Discord invite.',
            emoji: '📧',
            handler: this.boolSetting('Invite Filter', 'Invite filter will remove messages that contain Discord invites.', 'blockInvites')
          },
          {
            name: 'IP Filter',
            desc: 'Removes messages that contain an IP address.',
            emoji: '❗',
            handler: this.boolSetting('IP Filter', 'IP filter will remove messages that contain IP addresses.', 'blockIps')
          },
          {
            name: 'Zalgo Filter',
            desc: 'Removes messages that contain zalgo.',
            emoji: '🗑️',
            handler: this.boolSetting('Zalgo Filter', 'Zalgo filter will remove messages that contain zalgo.', 'blockZalgo')
          },
          /*{
            name: 'Self-Bot Detector',
            desc: 'Bans users who have self-bots.',
            emoji: '🤖',
            handler: this.boolSetting('Self-Bot Detector', 'Self-bot detector will ban users who use self-bots.', 'blockSelfBots')
          }*/
        ]
      },
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
            handler: this.boolSetting('Greeting', 'Greeting will greet new users that join the server.', 'greetingEnabled')
          },
          {
            name: 'Message',
            desc: 'The message that users will be greeted with.',
            emoji: '✉️',
            handler: this.stringSetting('Greeting Message', 'The greeting channel is the message users will be greeted with.', null, null,
              'How would you like to greet messages. You can mention the user through {mention}, and access the user\'s name through `{user}`, the server name through `{guild}`, and the member count through `{count}`', 'greetingMessage')
          },
          {
            name: 'Channel',
            desc: 'The channel that new users will be greeted on.',
            emoji: '#️⃣',
            handler: this.stringSetting('Greeting Channel', 'The greeting channel is the channel users will be greeted on.',
              promisify(Serializer.deserializeChannel), promisify(Serializer.serializeChannel), null, 'greetingChannel')
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
            handler: this.boolSetting('Goodbye', 'Goodbye will say goodbye to users that leave the server.', 'goodbyeEnabled')
          },
          {
            name: 'Message',
            desc: 'The message that users will be said goodbye with.',
            emoji: '✉️',
            handler: async (client, given, reply) => {
              const answer = await this.promptString(given, reply, 'goodbye message',
                'How would you like to say goodbye to people? You can access the user\'s name through `{user}`, the server name through `{guild}`, and the member count through `{count}`', null);
              if (!answer) return;

              await client.database.setGuild(given.guild.id, 'goodbyeMessage', answer)
                .finally(() => reply.reactions.removeAll())
                .then(() => reply.edit(success('Successfully updated database', 'embed')))
                .catch(err => reply.edit(alert('Unable to update database', 'embed')));
            }
          },
          {
            name: 'Channel',
            desc: 'The channel that new users will be said goodbye on.',
            emoji: '#️⃣',
            handler: this.stringSetting('Greeting Channel', 'The greeting channel is the channel users will be greeted on.',
              promisify(Serializer.deserializeChannel), promisify(Serializer.serializeChannel), null, 'goodbyeChannel')
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
            handler: this.stringSetting('Log Channel', 'The log channel is the channel where logs will be posted.',
              promisify(Serializer.deserializeChannel), promisify(Serializer.serializeChannel), null, 'logChannel')
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
                handler: this.boolSetting('Message Delete', 'Message deletes are whenever someone deletes a message.', 'logDelete')
              },
              {
                name: 'Message Edit',
                desc: 'Keeping track of when messages are edited.',
                emoji: '✏️',
                handler: this.boolSetting('Message Edit', 'Message edits are whenever someone edits a message.', 'logEdit')
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
            handler: this.boolSetting('Guardian Logs', 'Guardian Logs are whenever Guardian does something.', 'logGuardian')
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
                handler: this.boolSetting('User Join', 'User Joins are whenever someone joins the server.', 'logJoin')
              },
              {
                name: 'User Leave',
                desc: 'Keeping track of when users leave the server.',
                emoji: '📤',
                handler: this.boolSetting('User Leave', 'Message edits are whenever someone leaves the server.', 'logLeave')
              },
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
            menu: this.listSetting('Auto Role', 'role', 'roles', promisify(Serializer.deserializeRole), promisify(Serializer.serializeRole), 'autoRoles')
          }
        ]
      },
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
    ]
  }
};