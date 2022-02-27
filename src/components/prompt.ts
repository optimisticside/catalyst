// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import config from 'core/config';
import {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  ColorResolvable,
  MessageComponentInteraction
} from 'discord.js';
import { Component, action, ActionCallback, Redirector } from 'libs/fluid';

const { DEFAULT_COLOR } = config;

export interface PromptProps {
  header: string;
  body: string;
  footer?: string;
  onEnd: ActionCallback;
  onCollect: (collected: string, redirector: Redirector, interaction: MessageComponentInteraction) => any;
}

export default class PromptComponent extends Component {
  declare props: PromptProps;
  previousFreeze = true;

  constructor(props: PromptProps) {
    super(props);
  }

  render() {
    const embed = new MessageEmbed()
      .setColor(DEFAULT_COLOR as ColorResolvable)
      .setTitle(this.props.header)
      .setDescription(this.props.body);

    if (this.props.footer) {
      embed.setFooter({ text: this.props.footer });
    }

    return {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            label: 'Submit',
            style: 'SUCCESS',
            customId: action(this, async (redirector, interaction) => {
              const messages = await interaction.channel?.messages.fetch({ limit: 10 });
              if (!messages) return;

              const message = messages.filter(m => m.author === interaction.user).last();
              if (message) this.props.onCollect(message.content, redirector, interaction);
            })
          }),

          new MessageButton({
            label: 'End',
            style: 'DANGER',
            customId: action(this, this.props.onEnd)
          })
        )
      ]
    };
  }
}
