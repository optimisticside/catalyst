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
  desc?: string;
  body: Array<ListElement>
};

export default class ListComponent extends Component {
  declare props: ListProps;

  constructor(props: ListProps) {
    super(props);
    this.state.body = this.props.body;
  }

  componentDidUpdate(oldProps: ComponentProps, _oldState: ComponentState) {
    if (oldProps.header !== this.props.header) return true;
    // TODO: Finish this
    return true;
  }

  addElement(element: ListElement) {
    const newBody = this.state.body.concat([ element ]);
    return this.setState({ body: newBody });
  }

  render() {
    const embed = new MessageEmbed()
      .setTitle(this.props.header)
      .setColor(DEFAULT_COLOR as ColorResolvable);

    if (this.props.desc) {
      embed.setDescription(this.props.desc);
    }

    // We use fields only if we have names and values,
    // Otherwise, we just add it to the description.
    const description: Array<string> = [];
    this.state.body.map(({ name, desc }) => {
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
    const components = this.state.body
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