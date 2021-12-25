// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { MessageEmbed, MessageActionRow, MessageButton, ColorResolvable } from 'discord.js';
import { Component, ActionCallback } from 'libs/fluid';
import config from 'core/config';

const { DEFAULT_COLOR } = config;

export interface ConfirmationProps {
  header: string;
  body: string;
  ifYes: ActionCallback;
  ifNo: ActionCallback;
};

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

    const actionRow = new MessageActionRow()
      .addComponents(
        new MessageButton({
          label: 'Confirm',
          style: 'SUCCESS',
          customId: action(this, this.props.ifYes)
        }),
        new MessageButton({
          label: 'Cancel',
          style: 'DANGER',
           customId: action(this, this.props.ifNo)
        }),
      );

    return {
      embeds: [ embed ],
      components: [ actionRow ]
    }
  }
};