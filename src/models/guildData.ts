// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { Schema, model } from 'mongoose';
const moderationActions = [ 'Ban', 'Block', 'Kick', 'Mute', 'SoftBan', 'Strike', 'Temp Ban', 'Temp Mute' ];

const timerSchema = new Schema({
  user: String,
  date: Date
});

const moderationCaseSchema = new Schema({
  id: { type: String, require: true, unique: true },
  user: { type: String, require: true },
  reason: { type: String },
  moderator: { type: String },
  isValid: { type: Boolean },
  canEdit: { type: Boolean },
  type: { type: String, require: true, enum: moderationActions }
});

const strikePolicyActionSchema = new Schema({
  count: { type: Number, require: true },
  action: { type: String, reqquire: true, enum: moderationActions }
});

const reactionRoleSchema = new Schema({
  messageId: { type: String, require: true, unique: true },
  multiSelect: { type: Boolean, default: false },
  roleData: { type: Array, of: new Schema({
    roleId: { type: String, require: true, unique: true },
    name: { type: String, require: true }
  }) }
});

const guildDataSchema = new Schema({
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
  unmuteTimers: { type: Array, of: timerSchema },
  unbanTimers: { type: Array, of: timerSchema },
  channelUnlockTimers: { type: Array, of: timerSchema },
  moderationCases: { type: Array, of: moderationCaseSchema },
  strikePolicy: { type: Array, of: strikePolicyActionSchema },

  reactionRoleEnabled: { type: Boolean, default: false },
  reactionRoles: { type: Array, of: reactionRoleSchema },

  autoRoleEnabled: { type: Boolean, default: false },
  autoRoles: { type: Array, of: String, default: [] }
});

export default model('GuildDataModels', guildDataSchema);