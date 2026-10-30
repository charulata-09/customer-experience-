import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  } : undefined,
  redact: {
    paths: ['req.headers.authorization', 'password', 'token', 'access_token', 'gemini_api_key', 'api_key', 'apiKey'],
    censor: '[REDACTED]',
  },
});
