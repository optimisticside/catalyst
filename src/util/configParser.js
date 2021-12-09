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
  if (data == null) {
    if (spec.default) return spec.default;
    if (spec.require) throw new Error(`${name} is a required config entry`);
  }
  return elemHandlers[type](data, spec.of);
}

const parseConfig = (env, specs) => {
  let result = {};
  Object.entries(env).map(([ name, data ]) => {
    const spec = specs[name];
    if (!spec) return;
    result[name] = readElem(name, data, spec)
  });
  return result;
}
module.exports = parseConfig(process.env, template);