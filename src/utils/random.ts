// Catalyst
// Copyright 2022 Catalyst contributors
// See LICENSE for further details

import * as crypto from 'crypto';

export default async function randomNumber(nbytes = 4) {
  // Pack is just a helper function to pack a tuple into an array so it can be returned.
  // I'm not good enough at typescript to use generics here.
  const pack =
    (
      fn: (...args: any[]) => any // eslint-disable-line @typescript-eslint/no-explicit-any
    ) =>
    (
      ...args: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    ) =>
      fn([...args]);
  const [err, buf] = (await new Promise(res => crypto.randomBytes(nbytes, pack(res)))) as [Error, Buffer];
  if (err) return Promise.reject(err);

  let num = 0;
  for (let i = 0; i < nbytes; i++) {
    num |= buf[i] << (i * 8);
  }
  return num;
}

export async function randomInt(a: number, b: number) {
  return (Math.abs(await randomNumber()) % (b - a)) + a;
}
