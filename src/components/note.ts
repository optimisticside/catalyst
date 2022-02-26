// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { MessageEmbed, ColorResolvable, MessageActionRow, MessageButton } from 'discord.js';
import { Component, redirect } from 'libs/fluid';
import config from 'core/config';

const { DEFAULT_COLOR } = config;

export interface NoteProps {
  header: string;
  body: string;
  color?: ColorResolvable;
  backButton?: boolean;
  previousFreeze?: boolean;
}

export default class NoteComponent extends Component {
  declare props: NoteProps;

  constructor(props: NoteProps) {
    super(props);
    this.previousFreeze = !!this.props.previousFreeze;
  }

  render() {
    const buttons: Array<MessageButton> = [];
    const embed = new MessageEmbed()
      .setTitle(this.props.header)
      .setColor(this.props.color ?? (DEFAULT_COLOR as ColorResolvable))
      .setDescription(this.props.body);
    
    const backRedirect = this.props.backButton && this.previous && redirect(this, this.previous);
    if (backRedirect && buttons.length < 5) {
      buttons.push(
        new MessageButton({
          label: 'Back',
          style: 'DANGER',
          customId: backRedirect
        })
      );
    }

    const components: Array<MessageActionRow> = [];
    if (buttons.length > 0) {
      components.push(new MessageActionRow().addComponents(buttons));
    }

    return {
      embeds: [embed],
      components
    };
  }
}
