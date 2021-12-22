// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Schema, model } = require('mongoose');

const cooldownSchema = new Schema({
  command: { type: String, require: true, unique: true },
  since: { type: Date, require: true }
});

const userConfigSchema = new Schema({
  id: { type: String, require: true, unique: true },
  cooldowns: { type: Array, of: cooldownSchema, default: [] }
});

module.exports = model('UserConfigModels', userConfigSchema);