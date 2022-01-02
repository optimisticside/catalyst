// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { Schema, Document, model } from 'mongoose';
const moderationActions = ['Ban', 'Block', 'Kick', 'Mute', 'SoftBan', 'Strike', 'Temp Ban', 'Temp Mute'];

export enum ModerationAction {
  BAN = 'Ban',
  BLOCK = 'Block',
  KICK = 'Kick',
  MUTE = 'Mute',
  SOFT_BAN = 'SoftBan',
  STRIKE = 'Strike',
  TEMP_BAN = 'Temp Ban',
  TEMP_MUTE = 'Temp Mute'
}

export interface TimerDocument {
  user: string;
  date: Date;
}

const timerSchema = new Schema({
  user: String,
  date: Date
});

export interface ModerationCaseDocument {
  id: string;
  user: string;
  reason: string;
  moderator: string;
  isValid: boolean;
  canEdit: boolean;
  types: ModerationAction;
}

const moderationCaseSchema = new Schema({
  id: { type: String, require: true, unique: true },
  user: { type: String, require: true },
  reason: { type: String },
  moderator: { type: String },
  isValid: { type: Boolean },
  canEdit: { type: Boolean },
  type: { type: String, require: true, enum: moderationActions }
});

export interface StrikePolicyActionDocument {
  count: number;
  action: ModerationAction;
}

const strikePolicyActionSchema = new Schema({
  count: { type: Number, require: true },
  action: { type: String, reqquire: true, enum: moderationActions }
});

export interface ReactionRoleDocument {
  messageId: string;
  multiSelect: boolean;
  roleData: {
    roleId: string;
    name: string;
  };
}

const reactionRoleSchema = new Schema({
  messageId: { type: String, require: true, unique: true },
  multiSelect: { type: Boolean, default: false },
  roleData: {
    type: Array,
    of: new Schema({
      roleId: { type: String, require: true, unique: true },
      name: { type: String, require: true }
    })
  }
});

export interface GuildDocument extends Document {
  id: string;
  prefix?: string;

  greetingEnabled: boolean;
  greetingChannel?: string;
  greetingMessage: string;

  goodbyeEnabled: boolean;
  goodbyeChannel: string;
  goodbyeMessage: string;

  joinDmEnabled: boolean;
  joinDmMessage: string;

  boostMessageEnabled: boolean;
  boostMessageChannel: string;
  boostMessage: string;

  logsEnabled: boolean;
  logChannel: string;
  logMemberJoin: boolean;
  logMemberLeave: boolean;
  logMemberUpdate: boolean;
  logCommands: boolean;
  logGuardian: boolean;
  logMessageEdit: boolean;
  logMessageDelete: boolean;

  guardianEnabled: boolean;
  blacklistedWords: Array<string>;
  guardianWhitelist: Array<string>;
  antiSpamEnabled: boolean;
  filterZalgo: boolean;
  filterLinks: boolean;
  filterInvites: boolean;
  filterDuplicates: boolean;
  filterIps: boolean;
  filterSelfBots: boolean;

  muteRole: string;
  unmuteTimers: Array<TimerDocument>;
  unbanTimers: Array<TimerDocument>;
  channelUnlockTimers: Array<TimerDocument>;
  moderationCases: Array<ModerationCaseDocument>;
  strikePolicy: Array<StrikePolicyActionDocument>;

  reactionRoleEnabled: boolean;
  reactionRoles: Array<ReactionRoleDocument>;

  autoRoleEnabled: boolean;
  autoRoles: Array<string>;
}

const guildDataSchema = new Schema({
  id: { type: String, require: true, unique: true },
  prefix: { type: String },

  greetingEnabled: { type: Boolean, default: false },
  greetingChannel: { type: String },
  greetingMessage: {
    type: String,
    default: '{mention} has joined the server!'
  },

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
  filterDuplicates: { type: Boolean, default: false },
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
