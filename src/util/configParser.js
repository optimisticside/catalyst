// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

const template = require('../config.template.json');
require('dotenv').config();

const elemHandlers = {
  string: e => e,
  integer: e => parseInt(e),
  number: e => parseFloat(e),
  array: (e, of) => {
    // This not be provided for nested arrays,
    // which are not supported.
    if (!of) return;
    return e.split(',').map(x => elemHandlers[of](x));
  }
};

const readElem = (name, data, spec) => {
  const type = spec.type ?? spec ?? 'string';
  if (!data) {
    if (spec.default !== null) return spec.default;
    if (spec.require) throw new Error(`${name} is a required config entry`);
  }
  return elemHandlers[type](data, spec.of);
}

const parseConfig = (env, specs) => {
  let result = {};
  Object.entries(specs).map(([ name, spec ]) => {
    const data = env[name];
    result[name] = readElem(name, data, spec);
  });
  return result;
}
module.exports = parseConfig(process.env, template);