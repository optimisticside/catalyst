// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Interaction } = require('discord.js');
const { v4: uuidv4 } = require('uuid');

class Component {
  constructor(creator) {
    this.creator = creator;
  }
};

class Element {
  build(...given) {
    return this.component.creator(this, ...given);
  }

  addListener(customId, callback) {
    this.listeners.set(customId, callback);
  }

  handle(interaction) {
    const callback = this.listeners.get(interaction.customId);
    if (!callback) return;
    callback(interaction);
  }

  constructor(component) {
    this.alive = true;
    this.listeners = new Map();
    this.component = component;
  }
};

const genericMounter = async (element, given, options) => {
  const filter = i => i.user.id === (given.author?.id ?? given.user?.id);
  options = { ...options };
  options.filter = options.filter ?? filter;

  const built = element.build();
  const previous = element.previous;
  // Since buttons will be interactions, we need to check
  // if there was a reply in the previous element to see if it was
  // a slash-command intearction or not.
  if (given instanceof Interaction && !previous?.reply) {
    if (previous) {
      await given.update(built);
    } else {
      await given.reply(built);
    }
    return given.channel.createMessageComponentCollector(options);
  } else {
    let reply = null;
    if (previous?.reply) {
      await previous.reply.edit(built);
      reply = previous.reply;
    } else {
      reply = await given.reply(built);
    }
    element.reply = reply;
    return reply.createMessageComponentCollector(options);
  }
}

const mount = async (element, mounter, options) => {
  let args = [];
  if (!(mounter instanceof Function)) {
    args = [ mounter, options ];
    mounter = genericMounter;
  }

  const collector = await mounter(element, ...args);
  element.mounter = mounter;
  element.collector = collector;
 
  collector.on('collect', async i => {
    if (!element.alive) return;
    element.handle(i);
  });
};

const redirect = (element, redirect) => {
  const customId = uuidv4();
  element.addListener(customId, async i => {
    if (redirect instanceof Component) {
      redirect = new Element(redirect);
    }

    if (!redirect) return;
    element.alive = false;
    redirect.mounter = element.mounter;
    redirect.previous = element;
    // We need to set the redirect to be alive explicitly, in case
    // it is a redirect to a previous element.
    redirect.alive = true;

    const collector = await element.mounter(redirect, i);
    collector.on('collect', async i => {
      if (!redirect.alive) return;
      redirect.handle(i);
    });
  });
  return customId;
}

module.exports = { Component, Element, mount, redirect };