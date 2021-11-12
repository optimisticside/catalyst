// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Schema, model } = require('mongoose');

const moderationCaseSchema = new Schema({
  id: { type: String, require: true, unique: true },
  user: { type: String },
  reason: { type: String },
  moderator: { type: String },
  isValid: { type: Boolean },
  canEdit: { type: Boolean },
  type: { type: String, enum: [
    'Ban',
    'Block',
    'Kick',
    'Mute',
    'SoftBan',
    'Strike',
    'Temp Ban',
    'Temp Mute'
  ] }
});

module.exports = model("ModerationCaseModels", moderationCaseSchema);