import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later.', 429));
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('AUTH_RATE_LIMIT_EXCEEDED', 'Too many authentication attempts, please try again later.', 429));
  },
});

export const aiRateLimiter = rateLimit({
  windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
  max: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per authenticated user if available, otherwise by IP
    return req.user?.id || req.ip || 'anonymous';
  },
  handler: (req, res, next) => {
    next(new AppError('AI_RATE_LIMIT_EXCEEDED', 'Too many AI requests, please try again in a few minutes.', 429));
  },
});
