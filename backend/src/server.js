import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 CX Copilot Backend listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`Health check available at: http://localhost:${env.PORT}/health or http://localhost:${env.PORT}/api/v1/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.fatal(
      `❌ Port ${env.PORT} is already in use by another process.\n` +
      `   Either stop the existing process or change PORT in backend/.env to another port (e.g. 5001).`
    );
  } else {
    logger.fatal({ err }, 'Server socket error');
  }
  process.exit(1);
});

const handleShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection at Promise');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception thrown');
  process.exit(1);
});
