import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { analyticsDateRangeSchema } from '../validators/analytics.validator.js';
import {
  getOverview,
  getSentimentTrend,
  getCategories,
  getUrgency,
  getChannels,
} from '../controllers/analytics.controller.js';

const router = Router();

// Staff (Agent/Admin) only analytics
router.get(
  '/analytics/overview',
  requireAuth,
  requireRole('agent', 'admin'),
  validate({ query: analyticsDateRangeSchema }),
  getOverview
);

router.get(
  '/analytics/sentiment-trend',
  requireAuth,
  requireRole('agent', 'admin'),
  getSentimentTrend
);

router.get(
  '/analytics/categories',
  requireAuth,
  requireRole('agent', 'admin'),
  getCategories
);

router.get(
  '/analytics/urgency',
  requireAuth,
  requireRole('agent', 'admin'),
  getUrgency
);

router.get(
  '/analytics/channels',
  requireAuth,
  requireRole('agent', 'admin'),
  getChannels
);

export default router;
