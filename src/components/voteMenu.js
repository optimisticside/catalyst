// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { DEFAULT_COLOR } = require('../util/configParser.js');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Component, redirect, action } = require('../util/fluid.js');

module.exports = class VoteMenuComponent extends Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate(oldProps, oldState) {
    // TODO: Check props instead of just returning true.
    return true;
  }

  render(element) {
    const embed = new MessageEmbed()
      .setTitle(`Vote for ${this.props.name}`)
      .setColor(DEFAULT_COLOR)
      .setDescription(`Thanks for voting! Your vote helps other people discover ${this.props.name} and helps people maintain the bot and add new features.`);

    console.log(this.props)
    const links = [];
    if (this.props.showTopgg) links.push([ 'Top.gg', `https://top.gg/bot/${this.props.clientId}` ]);
    if (this.props.showDiscords) links.push([ 'Discords', `https://discords.com/bots/bot/${this.props.clientId}` ]);
    if (this.props.showDbl) links.push([ 'DBL', `https://discordbotlist.com/bots/${this.props.clientId}` ]);

    const actionRow = new MessageActionRow()
      .addComponents(
        ...links.map(([ name, url ]) => {
          return new MessageButton({
            label: name,
            style: 'LINK',
            url: url
          });
        })
      );

    return {
      embeds: [ embed ],
      components: links.length > 0 ? [ actionRow ] : []
    }
  }
};