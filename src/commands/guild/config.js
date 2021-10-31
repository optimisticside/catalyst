// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions, MessageEmbed } = require('discord.js');
const { alert, success, warning } = require('../../util/formatter.js')('Set-Prefix Command');
const { NAME, DEFAULT_COLOR } = require('../../config.json');
const Command = require('../../structs/command.js');
const OptionParser = require('../../util/optionParser.js');

module.exports = class ConfigCommand extends Command {
  awaitReaction(collector) {
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
      const reaction = await this.awaitReaction(collector).catch(() => {
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
        await client.database.setGuild(given.guild.id, ...key, true)
          .finally(() => reply.reactions.removeAll())
          .then(() => reply.edit(success(`Successfully disabled ${name}`, 'embed')))
          .catch(err => {
            console.log(`Unable to write to database: ${err}`);
            reply.edit(alert(`Unable to disable ${name}`, 'embed'))
          });
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
    const reaction = await this.awaitReaction(collector).catch(() => {
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
        name: 'Antispam',
        desc: 'Automatically mute users who spam in the chat.',
        emoji: '🔨',
        handler: this.boolSetting('Antispam', 'Antispam will automatically mute users who spam in the chat.', 'antiSpam')
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
            handler: this.boolSetting('Greeting', 'Greeting will greet new users that join the server.', 'greeting')
          },
          {
            name: 'Channel',
            desc: 'The channel that new users will be greeted on.',
            emoji: '#️⃣',
            handler: null,
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
            name: 'Channel',
            desc: 'The channel that new users will be said goodbye on.',
            emoji: '#️⃣',
            handler: null,
          }
        ]
      },
      {
        name: 'URL Filter',
        desc: 'Remove messages that contain links.',
        emoji: '🌐',
        handler: this.boolSetting('URL Filter', 'URL Filter will remove messages that contain links.', 'blockUrls')
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
        name: 'Logs',
        desc: 'Decide executed commands are executed.',
        emoji: '🗒️',
        handler: this.boolSetting('Logs', 'Logs will keep track of commands executed', 'commandLogs')
      },
      {
        name: 'Prefix',
        desc: 'Set a custom prefix.',
        emoji: '✨',
        handler: this.prefix
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