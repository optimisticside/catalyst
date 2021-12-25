// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import * as path from 'path';

export async function resolveFile<T>(file: string, ...args: any[]) : Promise<T | null> {
  const resolved = path.resolve(file);
  const File = await (await import(resolved)).default;
  return File?.constructor && new File(...args) as T;
}