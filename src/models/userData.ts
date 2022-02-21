// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { Schema, Document, model } from 'mongoose';

export interface CooldownDocument extends Document {
  command: string;
  since: Date;
}

const cooldownSchema = new Schema({
  command: { type: String, require: true, unique: true },
  since: { type: Date, require: true }
});

export interface UserDocument extends Document {
  id: string;
  cooldowns: Array<CooldownDocument>;
  xpData: Map<string, number>;
}

const userDataSchema = new Schema({
  id: { type: String, require: true, unique: true },
  cooldowns: { type: Array, of: cooldownSchema, default: [] },
  xpData: { type: Map, of: Number, default: new Map() }
});

export default model('UserDataModels', userDataSchema);
