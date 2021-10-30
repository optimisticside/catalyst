// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const { Permissions } = require('discord.js');

module.exports = (perm) => {
  // This is a cheap and lazy hack but it's great.
  const perms = Object.entries(Permissions.FLAGS);
  return perms.map(([ key, val ]) => val === perm);
};