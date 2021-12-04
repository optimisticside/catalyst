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

const parseConfig = (env, specs) => {
  let result = {};
  Object.entries(env).map(([ name, data ]) => {
    const spec = specs[name];
    if (!spec) return;
    const type = spec.type ?? spec ?? 'string';
    result[name] = elemHandlers[type](data, spec.of);
  });
  return result;
}
module.exports = parseConfig(process.env, template);