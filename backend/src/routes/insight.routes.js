import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  insightRequestSchema,
  insightIdParamSchema,
} from '../validators/analytics.validator.js';
import {
  generateReport,
  listReports,
  getReportById,
} from '../controllers/insight.controller.js';

const router = Router();

router.post(
  '/insights/generate',
  requireAuth,
  requireRole('admin'),
  aiRateLimiter,
  validate({ body: insightRequestSchema }),
  generateReport
);

router.get(
  '/insights',
  requireAuth,
  requireRole('agent', 'admin'),
  listReports
);

router.get(
  '/insights/:id',
  requireAuth,
  requireRole('agent', 'admin'),
  validate({ params: insightIdParamSchema }),
  getReportById
);

export default router;
