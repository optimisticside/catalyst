// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Interaction } = require('discord.js');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class Component extends EventEmitter {
  constructor(props) {
    super({ captureRejections: false });
    this.alive = true;
    this.state = {};
    this.props = props;
    this.listeners = new Map();
    if (this.defaultProps) {
      const defaults = Object.entries(this.defaultProps);
      // We cannot do [ name, default ] because `default` is
      // a keyword in Javascript.
      defaults.map(([ index, value ]) => {
        this.props[index] = this.props[index] ?? value;
      });
    }
  }

  onInteraction(interaction) {
    if (!this.alive) return;
    this.emit('interaction', interaction);
  }

  render() {
    // This will throw an error only if the component's sub-class
    // does not have a render method.
    throw new Error('No Render method provided');
  }

  componentDidUpdate(oldProps, oldState) {
    return true;
  }

  setState(changes) {
    const changesArray = Object.entries(changes);
    let oldState = {};
    Object.assign(oldState, this.state);
    changesArray.map(([ index, change ]) => {
      this.state[index] = change;
    });
    
    this.emit('stateChange', oldState);
    if (this.componentDidUpdate(this.props, oldState)) {
      this.emit('update');
    }
  }
};

const genericMounter = async (component, given, options) => {
  const filter = i => i.user.id === (given.author?.id ?? given.user?.id);
  options = { ...options };
  options.filter = options.filter ?? filter;

  const built = component.render();
  const previous = component.previous;
  component.renderOptions = options;
  component.mountPoint = given;
  // Since buttons will be interactions, we need to check
  // if there was a reply in the previous component to see if it was
  // a slash-command intearction or not.
  if (given instanceof Interaction && !previous?.reply) {
    if (previous) {
      await given.update(built);
    } else {
      await given.reply(built);
    }
    // Since the result of `given.reply()` is null and not a message,
    // we cannot just call `message.createMessageComponentCollector`.
    return given.channel.createMessageComponentCollector(options);
  } else {
    let reply = previous?.reply;
    if (reply) {
      await given.update(built);
    } else {
      reply = await given.reply(built);
    }
    component.reply = reply;
    return reply.createMessageComponentCollector(options);
  }
}

const reload = async (oldComponent, newComponent, interaction) => {
  // The old component is modified first it can also be 
  // the new component.
  oldComponent.alive = false;
  oldComponent.collector?.stop();
  newComponent.mounter = oldComponent.mounter;
  if (oldComponent !== newComponent) {
    newComponent.previous = oldComponent;
  } else {
    newComponent.previous = oldComponent.previous;
  }
  // We need to set the redirect to be alive explicitly, in case
  // it was once alive but later removed.
  newComponent.alive = true;

  const mountPoint = oldComponent.mountPoint;
  const collector = await newComponent.mounter(newComponent, interaction ?? mountPoint);
  newComponent.collector = collector;
  collector.on('collect', newComponent.onInteraction.bind(newComponent));
}

const mount = async (component, mounter, options) => {
  let args = [];
  // The caller is given the option to not provide
  // a custom mounter (since its only needed in niche cases).
  if (!(mounter instanceof Function)) {
    args = [ mounter, options ];
    mounter = genericMounter;
  }

  const collector = await mounter(component, ...args);
  component.mounter = mounter;
  component.collector = collector;
  component.on('update', () => {
    if (!component.alive) return;
    reload(component, component);
  })
 
  collector.on('collect', component.onInteraction.bind(component));
};

const action = (component, callback) => {
  // Sometimes the callbacks will be optional
  // props of the component.
  if (!callback) return;
  const customId = uuidv4();

  const redirector = (interaction, redirect) => {
    if (!redirect) return;
    reload(component, redirect, interaction);
  }

  component.on('interaction', async i => {
    if (i.customId !== customId) return;
    callback(redirect => redirector(i, redirect), i);
  });

  return customId;
}

const redirect = (component, redirect) => {
  return action(component, redirector => redirector(redirect));
}

module.exports = { Component, mount, redirect, action, reload };