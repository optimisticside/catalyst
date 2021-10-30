// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { CommandGroup } = require('../../structs/group');

module.exports = class PruneGroup extends CommandGroup {
  constructor() {
    super({
      name: 'prune',
      desc: 'Removes members that meet a requirement'
    });
  }
};