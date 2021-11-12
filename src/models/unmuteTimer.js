// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Schema, model } = require('mongoose');

const unmuteTimerSchema = new Schema({
  user: String,
  date: Date
});

module.exports = model("UnmuteTimerModels", unmuteTimerSchema);