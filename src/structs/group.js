class CommandGroup {
  constructor(data) {
    this.name = data.name || 'Untitled';
    this.desc = data.desc;
  }
};

class SubCommandGroup {
  constructor(data) {
    this.name = data.name || 'Untitled';
    this.desc = data.desc;
    this.group = data.group;
  }
};

module.exports = { CommandGroup, SubCommandGroup };