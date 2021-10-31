// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { MessageEmbed } = require('discord.js');
const { DEFAULT_COLOR, SUCCESS_COLOR, ALERT_COLOR, WARNING_COLOR, PROMPT_COLOR } = require('../config.json');
const DEFAULT_FORMATTER = 'plain';

const randomColor = () => 'RANDOM';

const formatters = {
  plain: {
    warning: message => `:warning: ${message}`,
    alert: message => `:exclamation: ${message}`,
    neutral: message => `${message}`,
    denial: message => `:no_entry: ${message}`,
    success: message => `:white_check_mark: ${message}`,
    prompt: message => `:question: ${message}`
  },

  bold: {
    warning: message => `:warning: **${message}**`,
    alert: message => `:exclamation: **${message}**`,
    neutral: message => `**${message}**`,
    denial: message => `:no_entry: **${message}**`,
    success: message => `:white_check_mark: **${message}**`,
    prompt: message => `:question: **${message}**`
  },

  embed: {
    warning: message => {
      const embed = new MessageEmbed()
        .setTitle(':warning: Alert')
        .setColor(WARNING_COLOR ?? randomColor())
        .setDescription(message);
      return { embeds: [ embed ] };
    },
    alert: message => {
      const embed = new MessageEmbed()
        .setTitle(':exclamation: Alert')
        .setColor(ALERT_COLOR ?? randomColor())
        .setDescription(message);
      return { embeds: [ embed ] };
    },
    neutral: message => {
      const embed = new MessageEmbed()
        .setTitle('Note')
        .setColor(DEFAULT_COLOR ?? randomColor())
        .setDescription(message);
      return { embeds: [ embed ] };
    },
    denial: message => {
      const embed = new MessageEmbed()
        .setTitle(':no_entry: Warning')
        .setColor(DENIAL_COLOR ?? randomColor())
        .setDescription(message)
      return { embeds: [ embed ] };
    },
    success: message => {
      const embed = new MessageEmbed()
        .setTitle(':white_check_mark: Success!')
        .setColor(SUCCESS_COLOR ?? randomColor())
        .setDescription(message);
      return { embeds: [ embed ] };
    },
    prompt: message => {
      const embed = new MessageEmbed()
        .setTitle(':question: Prompt')
        .setColor(PROMPT_COLOR ?? randomColor())
        .setDescription(message);
      return { embeds: [ embed ] };
    }
  }
};

module.exports = (title) => {
  return {
    warning: (message, type) => formatters[type ?? DEFAULT_FORMATTER].warning(message, title),
    alert: (message, type) => formatters[type ?? DEFAULT_FORMATTER].alert(message, title),
    neutral: (message, type) => formatters[type ?? DEFAULT_FORMATTER].neutral(message, title),
    denial: (message, type) => formatters[type ?? DEFAULT_FORMATTER].denial(message, title),
    success: (message, type) => formatters[type ?? DEFAULT_FORMATTER].success(message, title),
    prompt: (message, type) => formatters[type ?? DEFAULT_FORMATTER].prompt(message, title)
  };
};