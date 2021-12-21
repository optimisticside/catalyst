// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Component, redirect, action } = require('../util/fluid.js');

module.exports = class ConfirmationComponent extends Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate(oldProps, oldState) {
    // TODO: Check props instead of just returning true.
    return true;
  }

  render(element) {
    const embed = new MessageEmbed()
      .setTitle(this.props.header)
      .setColor(DEFAULT_COLOR)
      .setDescription(this.props.body);

    const actionRow = new MessageActionRow()
      .addComponents(
        new MessageButton({
          label: 'Confirm',
          style: 'SUCCESS',
          customId: redirect(element, action(element, this.props.ifYes))
        }),
        new MessageButton({
          label: 'Cancel',
          style: 'DANGER',
          customId: redirect(element, this.props.ifNo)
        }),
      );

    return {
      embeds: [ embed ],
      components: [ actionRow ]
    }
  }
};