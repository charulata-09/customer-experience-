import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimiter.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route modules
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import replyRoutes from './routes/reply.routes.js';
import chatRoutes from './routes/chat.routes.js';
import kbRoutes from './routes/kb.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import insightRoutes from './routes/insight.routes.js';
import customerRoutes from './routes/customer.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const app = express();

// Trust proxy for Render/Railway/Fly.io
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser with 100kb limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Global rate limiting
app.use(globalRateLimiter);

// Public health checks
app.use('/health', healthRoutes);
app.use('/api/v1', healthRoutes);

// Protected & Application API Routes under /api/v1
app.use('/api/v1', authRoutes);
app.use('/api/v1', ticketRoutes);
app.use('/api/v1', replyRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/v1', kbRoutes);
app.use('/api/v1', analyticsRoutes);
app.use('/api/v1', insightRoutes);
app.use('/api/v1', customerRoutes);
app.use('/api/v1', settingsRoutes);

// 404 Handler
app.use(notFoundHandler);

// Central Error Handler
app.use(errorHandler);

export default app;
