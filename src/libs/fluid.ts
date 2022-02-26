// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import {
  Interaction,
  Message,
  MessageComponentCollectorOptions,
  MessageEditOptions,
  MessageComponentInteraction,
  InteractionCollector,
  InteractionReplyOptions,
  CommandInteraction,
  ReplyMessageOptions
} from 'discord.js';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export type RenderOptions = MessageComponentCollectorOptions<MessageComponentInteraction>;
export type MountPoint = MessageComponentInteraction | CommandInteraction | Message;
export type Mounter = (
  component: Component,
  given: MountPoint,
  options?: RenderOptions
) => Promise<InteractionCollector<MessageComponentInteraction> | undefined>;

export type ComponentState = { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
export type ComponentProps = { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
export type ComponentListener = (interaction: MessageComponentInteraction) => void;

export type Redirector = (redirect: Component) => void;
export type ActionCallback = (redirector: Redirector, interaction: MessageComponentInteraction) => void;

export abstract class Component extends EventEmitter {
  alive: boolean;
  state: ComponentState;
  props: ComponentProps;
  defaultProps?: ComponentProps;

  collector?: InteractionCollector<MessageComponentInteraction>;
  mounter?: Mounter;
  previous?: Component;
  renderOptions?: RenderOptions;
  mountPoint?: MountPoint;
  reply?: Message;

  constructor(props?: ComponentProps) {
    super();
    this.alive = true;
    this.state = {};
    this.props = props ?? {};

    this.setMaxListeners(0);
    if (this.defaultProps) {
      const defaults = Object.entries(this.defaultProps);
      // We cannot do [ name, default ] because `default` is
      // a keyword in Javascript.
      defaults.map(([index, value]) => {
        this.props[index] = this.props[index] ?? value;
      });
    }
  }

  onInteraction(interaction: MessageComponentInteraction) {
    if (!this.alive) return;
    this.emit('interaction', interaction);
  }

  abstract render(): MessageEditOptions;

  componentDidUpdate(oldProps: ComponentProps, oldState: ComponentState) {
    return oldProps !== this.props || oldState !== this.state;
  }

  setState(changes: ComponentState) {
    const changesArray = Object.entries(changes);
    const oldState = {};
    Object.assign(oldState, this.state);
    changesArray.map(([index, change]) => {
      this.state[index] = change;
    });

    this.emit('stateChange', oldState);
    if (this.componentDidUpdate(this.props, oldState)) {
      this.emit('update');
    }
  }
}

const genericMounter = async (component: Component, given: MountPoint, options?: RenderOptions) => {
  const filter = (i: MessageComponentInteraction) =>
    i.user.id === (given instanceof Message ? given.author.id : given.user.id);
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
    if (previous && given instanceof MessageComponentInteraction) {
      await given.update(built);
    } else {
      await given.reply(built as InteractionReplyOptions);
    }
    // Since the result of `given.reply()` is null and not a message,
    // we cannot just call `message.createMessageComponentCollector`.
    return given.channel?.createMessageComponentCollector(options);
  } else {
    let reply = previous?.reply;
    if (reply && given instanceof MessageComponentInteraction) {
      await given.update(built);
    } else if (given instanceof Message) {
      reply = await given.reply(built as ReplyMessageOptions);
    }
    component.reply = reply;
    return reply?.createMessageComponentCollector(options);
  }
};

export const reload = async (
  oldComponent: Component,
  newComponent: Component,
  interaction?: MessageComponentInteraction
) => {
  // The old component is modified first it can also be
  // the new component.
  oldComponent.alive = false;
  oldComponent.collector?.stop();
  newComponent.mounter = oldComponent.mounter;
  if (oldComponent === newComponent) {
    newComponent.previous = oldComponent.previous;
  } else if (newComponent !== oldComponent.previous) {
    newComponent.previous = oldComponent;
  } else {
    // We are moving back to the previous component, so
    // oldComponent comes after newComponent. Therefore we must
    // go back two elements to get the new previous component.
    newComponent.previous = oldComponent.previous?.previous;
  }
  // We need to set the redirect to be alive explicitly, in case
  // it was once alive but later removed.
  newComponent.alive = true;

  if (newComponent.mounter === undefined) return;
  const mountPoint = interaction ?? oldComponent.mountPoint;
  if (!mountPoint) return;
  const collector = await newComponent.mounter(newComponent, mountPoint);
  newComponent.collector = collector;
  collector?.on('collect', newComponent.onInteraction.bind(newComponent));
};

export const mount = async (component: Component, point: MountPoint, options?: RenderOptions) => {
  const mounter = genericMounter;
  const collector = await mounter(component, point, options);
  component.mounter = mounter;
  component.collector = collector;
  component.on('update', () => {
    if (!component.alive) return;
    reload(component, component);
  });

  collector?.on('collect', component.onInteraction.bind(component));
};

export const action = (component: Component, callback: ActionCallback) => {
  // Sometimes the callbacks will be optional
  // props of the component.
  const customId: string = uuidv4();

  const redirector = (interaction: MessageComponentInteraction, redirect: Component) => {
    if (!redirect) return;
    reload(component, redirect, interaction);
  };

  component.on('interaction', async (i: MessageComponentInteraction) => {
    if (i.customId !== customId) return;
    callback(redirect => redirector(i, redirect), i);
  });

  return customId;
};

export const redirect = (component: Component, redirect: Component) => {
  return action(component, redirector => redirector(redirect));
};
