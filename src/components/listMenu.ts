// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import { MessageEmbed, MessageActionRow, MessageButton, ColorResolvable } from 'discord.js';
import { Component, redirect, action, ComponentProps, ComponentState, ActionCallback } from 'libs/fluid';
const { DEFAULT_COLOR } = config;

export interface ListElement {
  name: string;
  buttonName?: string;
  emoji?: string;
  description?: string;
  action?: ActionCallback;
}

export interface ListProps {
  header: string;
  description?: string;
  body: Array<ListElement>;
}

export interface ListState {
  body: Array<ListElement>;
}

export default class ListComponent extends Component {
  declare props: ListProps;
  declare state: ListState;

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
    const newBody = [...this.state.body, element];
    return this.setState({ body: newBody });
  }

  render() {
    const embed = new MessageEmbed().setTitle(this.props.header).setColor(DEFAULT_COLOR as ColorResolvable);

    if (this.props.description) {
      embed.setDescription(this.props.description);
    }

    // We use fields only if we have names and values,
    // Otherwise, we just add it to the description.
    const fullDescription: Array<string> = [];
    this.state.body.map(({ name, description, emoji }) => {
      if (emoji) {
        name = `${emoji} ${name}`;
      }

      if (description) {
        embed.addField(name, description);
      } else {
        fullDescription.push(name);
      }
    });
    if (fullDescription.length > 0) {
      embed.setDescription(fullDescription.join('\n'));
    }

    // Components will only be added if the body-element
    // has a callback.
    const buttons = this.state.body
      .filter(c => c.action)
      .map(({ buttonName, name, emoji, action: callback }) => {
        const customId = callback && action(this, callback);
        if (!customId) return;
        return new MessageButton({
          label: buttonName ?? name,
          style: 'SECONDARY',
          customId,
          emoji
        });
      })
      .filter(mb => mb) as Array<MessageButton>;

    // We cannot exceed the limit of buttons, which is 5.
    // TODO: This should be a constant.
    const backRedirect = this.previous && redirect(this, this.previous);
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
