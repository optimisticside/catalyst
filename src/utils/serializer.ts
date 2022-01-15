// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

export type Deserializable = string | number | boolean;

// This was created under the assumption that it would
// be a temporary solution, until someone gets an idea
// on how to replace it.
export default {
  serializeString: str => str,
  deserializeString: str => str,
  serializeInt: int => int.toString(),
  deserializeInt: str => parseInt(str),
  serializeFloat: float => float.toString(),
  deserializeFloat: str => parseFloat(str),
  serializeBoolean: bool => new Boolean(bool).toString(),
  deserializeBoolean: str => Boolean(str),
  serializeUser: user => `<@${user}>`,
  deserializeUser: str => str.match(/^<@!?(\d+)>$/)[1],
  serializeChannel: channel => `<#${channel}>`,
  deserializeChannel: str => str.match(/^<#(\d+)>$/)[1],
  serializeRole: role => `<@${role}>`,
  deserializeRole: str => str.match(/^<@&?(\d+)>$/)[1],
  serializeMentionable: mentionable => `<@${mentionable}>`,
  deserializeMentionable: str => str.match(/^<@&?(\d+)>$/)[1]
};
