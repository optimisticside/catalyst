// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for details

import { Schema, Document, model } from 'mongoose';

export interface UserDocument extends Document {
  id: string;
  cooldowns: Map<string, Date>;
  xpData: Map<string, number>;
}

const userDataSchema = new Schema({
  id: { type: String, require: true, unique: true },
  cooldowns: { type: Map, of: Date, default: new Map },
  xpData: { type: Map, of: Number, default: new Map }
});

export default model('UserDataModels', userDataSchema);
