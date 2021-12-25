// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { MessageEmbed, MessageActionRow, MessageButton, ColorResolvable } from 'discord.js';
import { Component, redirect, action, ComponentProps, ComponentState, ActionCallback } from 'libs/fluid';
const { DEFAULT_COLOR } = config;

export interface ListElement {
  name: string;
  desc?: string;
  action?: ActionCallback;
};

export interface ListProps {
  header: string;
  body: Array<ListElement>
};

export default class ListComponent extends Component {
  declare props: ListProps;

  constructor(props: ListProps) {
    super(props);
  }

  componentDidUpdate(oldProps: ComponentProps, _oldState: ComponentState) {
    if (oldProps.header !== this.props.header) return true;
    // TODO: Finish this
    return true;
  }

  render() {
    const embed = new MessageEmbed()
      .setTitle(this.props.header)
      .setColor(DEFAULT_COLOR as ColorResolvable);
    
    // We use fields only if we have names and values,
    // Otherwise, we just add it to the description.
    const description: Array<string> = [];
    this.props.body.map(({ name, desc }) => {
      if (desc) {
        embed.addField(name, desc);
      } else {
        description.push(name);
      }
    });
    if (description.length > 0) {
      embed.setDescription(description.join('\n'));
    }

    // Components will only be added if the body-element
    // has a callback.
    const components = this.props.body
      .filter(c => c.action)
      .map(({ name, action: callback }) => {
        const customId = callback && action(this, callback);
        if (!customId) return;
        return new MessageButton({
          label: name,
          style: 'SECONDARY',
          customId
        });
      })
      .filter(mb => mb !== undefined) as Array<MessageButton>;

    // We cannot exceed the limit of buttons, which is 5.
    // TODO: This should be a constant.
    const backRedirect = this.previous && redirect(this, this.previous);
    if (backRedirect && components.length < 5) {
      components.push(new MessageButton({
        label: 'Back',
        style: 'DANGER',
        customId: backRedirect
      }));
    }

    return {
      embeds: [ embed ],
      components: [ new MessageActionRow().addComponents(components) ]
    }
  }
}