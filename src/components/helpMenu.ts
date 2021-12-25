// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { MessageEmbed, MessageActionRow, MessageButton, ColorResolvable } from 'discord.js';
import { Component, redirect } from 'libs/fluid';
import ListMenu from '@components/listMenu';

const { DEFAULT_COLOR } = config;

export default class HelpMenuComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const embed = new MessageEmbed()
      .setTitle(this.props.name)
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(`:wave: Hello, I'm ${this.props.name}! I'm a Discord bot that runs commands. You can run commands through the chat using the prefix \`${this.props.prefix}\`, or through slash commands.`);

    const commandsList = new ListMenu({
      header: 'Commands',
      body: this.props.commands.map(({ name }) => {
        return { name };
      }),
    });

    return {
      embeds: [ embed ],
      components: [
        new MessageActionRow()
          .addComponents(
            new MessageButton({ label: 'Commands', style: 'PRIMARY', customId: redirect(this, commandsList) }),
            new MessageButton({ label: 'Invite', style: 'LINK', url: this.props.invite }),
            new MessageButton({ label: 'Support Server', style: 'LINK', url: this.props.supportServer })
          )
      ]
    };
  }
};