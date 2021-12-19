// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

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

const mount = async (element, mounter) => {
  const built = element.build();
  const collector = await mounter(built);

  element.mounter = mounter;
  element.collector = collector;

  collector.on('collect', async i => {
    if (!element.alive) return;
    element.handle(i);
  });

  return built;
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

    const built = redirect.build();
    const collector = await element.mounter(built);
    collector.on('collect', async i => {
      if (!redirect.alive) return;
      redirect.handle(i);
    });
  });
  return customId;
}

module.exports = { Component, Element, mount, redirect };