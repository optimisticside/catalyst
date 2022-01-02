// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

export interface CommandGroupOptions {
  name: string;
  desc: string;
}

export class CommandGroup implements CommandGroupOptions {
  name: string;
  desc: string;

  constructor(data: CommandGroupOptions) {
    this.name = data.name;
    this.desc = data.desc;
  }
}

export interface SubCommandGroupOptions {
  name: string;
  desc: string;
  group: string;
}

export class SubCommandGroup implements SubCommandGroupOptions {
  name: string;
  desc: string;
  group: string;

  constructor(data: SubCommandGroupOptions) {
    this.name = data.name;
    this.desc = data.desc;
    this.group = data.group;
  }
}
