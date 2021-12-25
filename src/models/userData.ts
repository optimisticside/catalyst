// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { Schema, model } from 'mongoose';

const cooldownSchema = new Schema({
  command: { type: String, require: true, unique: true },
  since: { type: Date, require: true }
});

const userDataSchema = new Schema({
  id: { type: String, require: true, unique: true },
  cooldowns: { type: Array, of: cooldownSchema, default: [] }
});

export default model('UserDataModels', userDataSchema);