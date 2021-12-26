// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import * as template from '../config.template.json';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

type ConfigTemplate = {[key: string]: string | ElementSpec};
type ElemHandler = (element: string, of?: string) => any;

interface ElementSpec {
  type: string;
  require?: boolean;
  default?: any;
  of?: any;
};

interface ParsedConfig {
  NAME: string;

  CREATORS: Array<string>;
  CLIENT_ID: string;
  SUPPORT_SERVER: string;
  TOKEN: string;

  PORT: number;
  PREFIX: string;
  DEFAULT_COOLDOWN: number;
  REST_TIME_OFFSET: number;
  TOTAL_SHARDS?: number;
  SHARD_LIFETIME?: number;
  LIFETIME?: number;

  DEFAULT_COLOR: string;
  ALERT_COLOR: string;
  WARNING_COLOR: string;
  SUCCESS_COLOR: string;
  PROMPT_COLOR: string;
  DENIAL_COLOR: string;

  MONGODB_SRV: string;
  COOLDOWN_PERSISTANCE_THRESHOLD: number;

  STATS_UPDATE_INTERVAL: number;
  DBL_TOKEN?: string;
  DISCORDS_TOKEN?: string;
  TOPGG_TOKEN?: string;
  DISCORD_LABS_TOKEN?: string;
  STATCORD_TOKEN?: string;
};

const elemHandlers: {[key: string]: ElemHandler} = {
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

const readElem = (name: string, data: any, spec: string | ElementSpec) => {
  // Because typescript does not recognize `typeof` to be
  // type narrowing, we have to use some hacky workarounds.
  const isString = typeof spec === 'string';
  const asObject = spec as ElementSpec;
  const type = isString ? spec as string : asObject.type ?? 'string';
  if (!data && !isString) {
    if (asObject.default !== undefined) return asObject.default;
    if (asObject.require) throw new Error(`${name} is a required config entry`);
  }
  return elemHandlers[type](data, isString ? undefined : asObject.of);
}

const parseConfig = (env: NodeJS.ProcessEnv, specs: ConfigTemplate): ParsedConfig => {
  let result = {};
  Object.entries(specs).map(([ name, spec ]) => {
    const data = env[name];
    result[name] = readElem(name, data, spec);
  });
  return result as ParsedConfig;
}

export default parseConfig(process.env, template);