import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  
  // Safe message for client
  let message = err.message || 'An unexpected internal error occurred.';
  let details = err.details || null;

  // Supabase or PostgreSQL error handling
  if (err.code && typeof err.code === 'string' && (err.code.startsWith('23') || err.code.startsWith('42') || err.code.startsWith('PGRST'))) {
    message = 'A database validation or integrity constraint error occurred.';
    details = env.NODE_ENV === 'development' ? err.message : null;
  }

  // Hide stack trace and internal message in production for 500s
  if (statusCode >= 500 && env.NODE_ENV === 'production') {
    message = 'An unexpected internal error occurred. Please try again later.';
    details = null;
  }

  logger.error({
    err: {
      message: err.message,
      code: err.code,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    url: req.originalUrl,
    method: req.method,
    statusCode,
  }, 'Request error encountered');

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
};
