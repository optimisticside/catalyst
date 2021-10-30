const { CommandGroup } = require('../../structs/group.js');

module.exports = class SetGroup extends CommandGroup {
  constructor() {
    super({
      name: 'set',
      desc: 'Sets a value.',
    })
  }
};