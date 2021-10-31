// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions, MessageEmbed } = require('discord.js');
const { alert, success, warning, prompt, neutral } = require('../../util/formatter.js')('Set-Prefix Command');
const { NAME, DEFAULT_COLOR } = require('../../config.json');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class ConfigCommand extends Command {
  awaitCollection(collector) {
    return new Promise((resolve, reject) => {
      collector.on('collect', resolve);
      collector.on('end', reject);
    });
  }

  boolSetting(name, desc, ...key) {
    return async (client, given, reply) => {
      const embed = new MessageEmbed()
        .setTitle(name)
        .setColor(DEFAULT_COLOR)
        .setDescription(desc)
        .setFooter('Would you like to enable it?');
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
      if (reaction.emoji.name === '✅') {
        await client.database.setGuild(given.guild.id, ...key, true)
          .finally(() => reply.reactions.removeAll())
          .then(() => reply.edit(success(`Successfully enabled ${name}`, 'embed')))
          .catch(err => {
            console.log(`Unable to write to database: ${err}`);
            reply.edit(alert(`Unable to enable ${name}`, 'embed'));
          });
      }

      if (reaction.emoji.name === '❌') {
        await client.database.setGuild(given.guild.id, ...key, false)
          .finally(() => reply.reactions.removeAll())
          .then(() => reply.edit(success(`Successfully disabled ${name}`, 'embed')))
          .catch(err => {
            console.log(`Unable to write to database: ${err}`);
            reply.edit(alert(`Unable to disable ${name}`, 'embed'))
          });
      }
    }
  }

  stringSetting(name, desc, validator, promptMessage, ...key) {
    return async (client, given, reply) => {
      const current = await client.database.getGuild(given.guild.id, ...key);
      const embed = new MessageEmbed()
        .setTitle(name)
        .setColor(DEFAULT_COLOR)
        .setDescription(`${desc}\nThe current ${name.toLowerCase()} is \`${current}\``)
        .setFooter('Would you like change it?');
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
      if (reaction.emoji.name === '❌') {
        reply.reactions.removeAll();
        reply.edit(neutral(`The ${name.toLowerCase()} has not been changed`, 'embed'));
      };

      if (reaction.emoji.name === '✅') {
        reply.reactions.removeAll();
        reply.edit(prompt(promptMessage ?? `What would you like to set the ${name.toLowerCase()} to`, 'embed'));

        const filter = m => m.author === given.author;
        const collector = reply.channel.createMessageCollector({ filter, time: 30000 });
        const message = await this.awaitCollection(collector).catch(() => {
          reply.reply(warning('Timed out.'));
        });

        if (!message) return;
        if (validator && !await validator(message.content)) {
          reply.reactions.removeAll();
          reply.edit(alert(`Invalid ${name.toLowerCase()} provided`, 'embed'));
          return;
        }
        await client.database.setGuild(given.guild.id, ...key, message.content)
          .finally(() => reply.reactions.removeAll())
          .then(() => reply.edit(success('Successfully updated database', 'embed')))
          .catch(err => reply.edit(alert('Unable to update database', 'embed')));
      }
    }
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
    return await this.loadMenu(client, given, null, NAME,
      `React with the corresponding emoji to configure ${NAME}.`, this.settings);
  }

  constructor() {
    super({
      name: 'config',
      desc: 'Lets you manage the guild configuration.',
      perms: [ Permissions.FLAGS.SEND_MESSAGES ],
      guildOnly: true,
      tags: [ 'guild' ]
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
            menu: [
              {
                name: 'Add',
                desc: 'Add a word to the blacklist.',
                emoji: '✏️',
                handler: async (client, given, reply) => {
                  const raw = await client.database.getGuild(given.guild.id, 'blacklistedWords') || '[]';
                  const blacklisted = JSON.parse(raw);
                  reply.reactions.removeAll();
                  reply.edit(prompt('What word would you like to add', 'embed'));

                  const filter = m => m.author === given.author;
                  const collector = reply.channel.createMessageCollector({ filter, time: 30000 });
                  const message = await this.awaitCollection(collector).catch(() => {
                    reply.reply(warning('Timed out.'));
                  });
                  if (!message) return;
                  const word = message.content.toLowerCase();
                  if (blacklisted.find(w => w === word)) {
                    return reply.edit(warning('That word is already blacklisted', 'embed'))
                  }

                  blacklisted.push(word);
                  const json = JSON.stringify(blacklisted);
                  await client.database.setGuild(given.guild.id, 'blacklistedWords', json)
                    .finally(() => reply.reactions.removeAll())
                    .then(() => reply.edit(success('Successfully updated database', 'embed')))
                    .catch(err => reply.edit(alert('Unable to update database', 'embed')));
                }
              },
              {
                name: 'Remove',
                desc: 'Remove a word from the blacklist.',
                emoji: '🗑️',
                handler: async (client, given, reply) => {
                  const raw = await client.database.getGuild(given.guild.id, 'blacklistedWords') || '[]';
                  const blacklisted = JSON.parse(raw);
                  reply.reactions.removeAll();
                  reply.edit(prompt('What word would you like to remove', 'embed'));

                  const filter = m => m.author === given.author;
                  const collector = reply.channel.createMessageCollector({ filter, time: 30000 });
                  const message = await this.awaitCollection(collector).catch(() => {
                    reply.reply(warning('Timed out.'));
                  });
                  if (!message) return;
                  const word = message.content.toLowerCase();
                  const index = blacklisted.findIndex(w => w === word);
                  if (!index) {
                    return reply.edit(warning('That word is not blacklisted', 'embed'))
                  }

                  blacklisted.splice(index, 1);
                  const json = JSON.stringify(blacklisted);
                  await client.database.setGuild(given.guild.id, 'blacklistedWords', json)
                    .finally(() => reply.reactions.removeAll())
                    .then(() => reply.edit(success('Successfully updated database', 'embed')))
                    .catch(err => reply.edit(alert('Unable to update database', 'embed')));
                }
              },
              {
                name: 'List',
                desc: 'See the list of blacklisted words in your DMs.',
                emoji: '👁️',
                handler: async (client, given, reply) => {
                  const raw = await client.database.getGuild(given.guild.id, 'blacklistedWords') || '[]';
                  const blacklisted = JSON.parse(raw);
                  const embed = new MessageEmbed()
                    .setTitle('Guardian Blacklist')
                    .setColor(DEFAULT_COLOR)
                    .setDescription(blacklisted.join('\n'));
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
            handler: this.stringSetting('Greeting Message', 'The greeting channel is the message users will be greeted with.',
              null, 'How would you like to greet messages. You can access the user\'s name through `{user}` and guild name through `{guild}`', 'greetingMessage')
          },
          {
            name: 'Channel',
            desc: 'The channel that new users will be greeted on.',
            emoji: '#️⃣',
            handler: this.stringSetting('Greeting Channel', 'The greeting channel is the channel users will be greeted on.',
              async (channel) => channel.match(/^<@!?(\d+)>$/), null, 'greetingChannel')
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
            handler: this.boolSetting('Goodbye', 'Goodbye will say goodbye to users that leave the server.', 'goodbye')
          },
          {
            name: 'Message',
            desc: 'The message that users will be said goodbye with.',
            emoji: '✉️',
            handler: async (client, given, reply) => {
              reply.reactions.removeAll();
              reply.edit(prompt('How would you like to say goodbye to people? You can access the user\'s name through `{user}` and guild name through `{guild}`', 'embed'));

              const filter = m => m.author === given.author;
              const collector = reply.channel.createMessageCollector({ filter, time: 30000 });
              const message = await this.awaitCollection(collector).catch(() => {
                reply.reply(warning('Timed out.'));
              });
              if (!message) return;
              
              await client.database.setGuild(given.guild.id, 'goodbyeMessage', message.content)
                .finally(() => reply.reactions.removeAll())
                .then(() => reply.edit(success('Successfully updated database', 'embed')))
                .catch(err => reply.edit(alert('Unable to update database', 'embed')));
            }
          },
          {
            name: 'Channel',
            desc: 'The channel that new users will be said goodbye on.',
            emoji: '#️⃣',
            handler: null,
          }
        ]
      },
      {
        name: 'Logs',
        desc: 'Decide executed commands are executed.',
        emoji: '🗒️',
        handler: this.boolSetting('Logs', 'Logs will keep track of commands executed', 'commandLogs')
      },
      {
        name: 'Prefix',
        desc: 'Set a custom prefix.',
        emoji: '✨',
        handler: this.stringSetting('Prefix', 'You can set a custom prefix for this guild', null, null, 'prefix')
      },
      {
        name: 'Auto Role',
        desc: 'Automatically assign roles to people that join.',
        emoji: '🤖',
        handler: this.autoRole
      }
    ]
  }
};