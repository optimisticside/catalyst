// Catalyst
// Copyright 2021 Catalyst contributors
// See LICENSE for details

import { createLogger as winstonCreateLogger, format, transports, Logger as WinstonLogger } from 'winston';

export type Logger = WinstonLogger;
export function createLogger(defaultMeta?: any) {
  let formatting = [format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.errors({ stack: true })];
  if (process.env.NODE_ENV === 'production') {
    formatting = [...formatting, format.json()];
  } else {
    formatting = [
      ...formatting,
      format.cli(),
      format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level} ${message}`;
      })
    ];
  }
  return winstonCreateLogger({
    format: format.combine(...formatting),
    defaultMeta,
    transports: [new transports.Console()]
  });
}
