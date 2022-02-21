// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for further details

import * as crypto from 'crypto';

export default async function randomNumber(nbytes = 4) {
  // Pack is just a helper function to pack a tuple into an array so it can be returned.
  const pack =
    (fn: Function) =>
    (...args: any[]) =>
      fn([...args]);
  const [err, buf] = await new Promise(res => crypto.randomBytes(nbytes, pack(res)));
  if (err) return Promise.reject(err);

  let num = 0;
  for (let i = 0; i < nbytes; i++) {
    num |= buf[i] << (i * 8);
  }
  return num;
}
