// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { MessageEmbed, MessageActionRow, MessageButton, ColorResolvable } from 'discord.js';
import { Component, ActionCallback, action } from 'libs/fluid';
import config from 'core/config';

const { DEFAULT_COLOR } = config;

export interface ConfirmationProps {
  header: string;
  body: string;
  footer?: string;
  ifYes: ActionCallback;
  ifNo: ActionCallback;
}

export default class ConfirmationComponent extends Component {
  declare props: ConfirmationProps;

  constructor(props: ConfirmationProps) {
    super(props);
  }

  render() {
    const embed = new MessageEmbed()
      .setTitle(this.props.header)
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setDescription(this.props.body);
    
    if (this.props.footer) {
      embed.setFooter({ text: this.props.footer });
    }

    const components: Array<MessageButton> = [];
    const yesAction = action(this, this.props.ifYes);
    const noAction = action(this, this.props.ifNo);
    if (yesAction) {
      components.push(
        new MessageButton({
          label: 'Confirm',
          style: 'SUCCESS',
          customId: yesAction
        })
      );
    }
    if (noAction) {
      components.push(
        new MessageButton({
          label: 'Cancel',
          style: 'DANGER',
          customId: noAction
        })
      );
    }

    const actionRow = new MessageActionRow().addComponents(components);

    return {
      embeds: [embed],
      components: [actionRow]
    };
  }
}
