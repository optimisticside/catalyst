// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { MessageEmbed, ColorResolvable } from 'discord.js';
import { Component } from 'libs/fluid';
import config from 'core/config';

const { DEFAULT_COLOR } = config;

export interface NoteProps {
  header: string;
  body: string;
  color?: ColorResolvable
};

export default class NoteComponent extends Component {
  declare props: NoteProps;

  constructor(props: NoteProps) {
    super(props);
  }

  render() {
    const embed = new MessageEmbed()
      .setTitle(this.props.header)
      .setColor(this.props.color ?? DEFAULT_COLOR as ColorResolvable)
      .setDescription(this.props.body);

    return {
      embeds: [ embed ]
    }
  }
};