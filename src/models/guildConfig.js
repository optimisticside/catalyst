// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { PREFIX } = require('../config.json');
const { Schema, model, SchemaTypes } = require('mongoose');
const UnmuteTimer = require('./unmuteTimer.js');
const UnbanTimer = require('./unbanTimer.js');
const ModerationCase = require('./moderationCase.js');

const guildConfigSchema = new Schema({
  id: { type: String, require: true, unique: true },
  prefix: { type: String },

  greetingEnabled: { type: Boolean, default: false },
  greetingChannel: { type: String },
  greetingMessage: { type: String, default: '{mention} has joined the server!' },
  
  goodbyeEnabled: { type: Boolean, default: false },
  goodbyeChannel: { type: String },
  goodbyeMessage: { type: String, default: '{user} has left the server!' },

  joinDmEnabled: { type: Boolean, default: false },
  joinDmMessage: { type: String, default: 'Welcome to {guild}, {user}!' },

  boostMessageEnabled: { type: Boolean, default: false },
  boostMessageChannel: { type: String },
  boostMessage: { type: String, default: '{user} just boosted the server!' },

  logsEnabled: { type: Boolean, default: false },
  logChannel: { type: String },
  logMemberJoin: { type: Boolean, default: false },
  logMemberLeave: { type: Boolean, default: false },
  logMemberUpdate: { type: Boolean, default: false },
  logCommands: { type: Boolean, default: false },
  logGuardian: { type: Boolean, default: false },
  logMessageEdit: { type: Boolean, default: false },
  logMessageDelete: { type: Boolean, default: false },

  guardianEnabled: { type: Boolean, default: false },
  blacklistedWords: { type: Array, of: String, default: [] },
  guardianWhitelist: { type: Array, of: String, default: [] },
  antiSpamEnabled: { type: Boolean, default: false },
  filterZalgo: { type: Boolean, default: false },
  filterLinks: { type: Boolean, default: false },
  filterInvites: { type: Boolean, default: false },
  filterIps: { type: Boolean, default: false },
  filterSelfBots: { type: Boolean, default: false },

  muteRole: { type: String },
  unmuteTimers: { type: Array , of: { type: SchemaTypes.ObjectId, ref: UnmuteTimer }, default: [] },
  unbanTimers: { type: Array, of: { type: SchemaTypes.ObjectId, ref: UnbanTimer }, default: [] },
  moderationCases: { type: Array, of: { type: SchemaTypes.ObjectId, ref: ModerationCase }, default: [] },
  strikePolicy: { type: Array, of: {
    count: { type: String, unique: true },
    action: { type: String, enum: [
      'Ban',
      'Block',
      'Kick',
      'Mute',
      'SoftBan',
      'Strike',
      'Temp Ban',
      'Temp Mute'
    ] }
  } },

  autoRoleEnabled: { type: Boolean, default: false },
  autoRoles: { type: Array, of: String, default: [] }
});

module.exports = model("GuildConfigModels", guildConfigSchema);