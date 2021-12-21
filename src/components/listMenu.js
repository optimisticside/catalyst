// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { DEFAULT_COLOR } = require('../util/configParser.js');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Component, redirect, action } = require('../util/fluid.js');

module.exports = class ListComponent extends Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate(oldProps, oldState) {
    if (oldProps.header !== this.props.header) return true;
    // TODO: Finish this
    return true;
  }

  render() {
    const fields = this.props.body.map(({ name, desc }) => {
      return { name, value: desc };
    });

    const embed = new MessageEmbed()
      .setTitle(this.props.header)
      .setColor(DEFAULT_COLOR);
    
    // We use fields only if we have names and values,
    // Otherwise, we just add it to the description.
    const description = [];
    this.props.body.map(({ name, desc }) => {
      if (desc) {
        embed.addField(name, description);
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
      .filter(c => c.redirect)
      .map(({ name, callback }) => {
        return new MessageButton({
          label: name,
          style: 'SECONDARY',
          customId: action(this, callback)
        });
      });

    // We cannot exceed the limit of buttons, which is 5.
    // TODO: This should be a constant.
    if (this.previous && components.length < 5) {
      components.push(new MessageButton({
        label: 'Back',
        style: 'DANGER',
        customId: redirect(this, this.previous)
      }));
    }

    return {
      embeds: [ embed ],
      components: [ new MessageActionRow().addComponents(components) ]
    }
  }
}