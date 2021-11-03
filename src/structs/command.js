// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

module.exports = class Command {
  async run() {
    throw new Error(`${this.name} doesn't have a run() method.`);
  }

  constructor(info) {
    this.name = info.name || 'Untitled';
    this.type = info.type || 'default';
    this.aliases = info.aliases || [];
    this.options = info.options || [];
    this.group = info.group;
    this.subGroup = info.subGroup;
    this.groupMember = info.groupMember || info.name;
    this.desc = info.desc || 'No description';
    this.cooldown = info.cooldown;
    this.tags = info.tags || [];
    this.examples = info.examples || [];
    this.authors = info.authors || [];
    this.userPerms = info.userPerms || info.perms || [];
    this.botPerms = info.botPerms || info.perms || [];
    this.passive = Boolean(info.passive);
    this.hidden = Boolean(info.hidden);
    this.guildOnly = Boolean(info.guildOnly);
    this.ownerOnly = Boolean(info.ownerOnly);
    this.allowBots = Boolean(info.allowBots);
    this.nsfw = Boolean(info.nsfw);
  }
};