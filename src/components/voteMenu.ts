// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { MessageEmbed, MessageActionRow, MessageButton, ColorResolvable } from 'discord.js';
import { Component } from 'libs/fluid';
const { DEFAULT_COLOR } = config;

export interface VoteMenuProps {
  name: string;
  clientId: string;
  showTopgg?: boolean;
  showDiscords?: boolean;
  showDbl?: boolean;
}

export default class VoteMenuComponent extends Component {
  declare props: VoteMenuProps;

  constructor(props: VoteMenuProps) {
    super(props);
  }

  render() {
    const embed = new MessageEmbed()
      .setTitle(`Vote for ${this.props.name}`)
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(
        `Thanks for voting! Your vote helps other people discover ${this.props.name} and helps people maintain the bot and add new features.`
      );

    const links: Array<Array<string>> = [];
    if (this.props.showTopgg) links.push(['Top.gg', `https://top.gg/bot/${this.props.clientId}`]);
    if (this.props.showDiscords) links.push(['Discords', `https://discords.com/bots/bot/${this.props.clientId}`]);
    if (this.props.showDbl) links.push(['DBL', `https://discordbotlist.com/bots/${this.props.clientId}`]);

    const actionRow = new MessageActionRow().addComponents(
      ...links.map(([name, url]) => {
        return new MessageButton({
          label: name,
          style: 'LINK',
          url: url
        });
      })
    );

    return {
      embeds: [embed],
      components: links.length > 0 ? [actionRow] : []
    };
  }
}
