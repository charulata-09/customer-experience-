import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { customerIdParamSchema } from '../validators/analytics.validator.js';
import {
  getCustomerProfile,
  generateRecommendations,
  getLatestRecommendations,
} from '../controllers/customer.controller.js';

const router = Router();

router.get(
  '/customers/:id/profile',
  requireAuth,
  requireRole('agent', 'admin'),
  validate({ params: customerIdParamSchema }),
  getCustomerProfile
);

router.post(
  '/customers/:id/recommendations',
  requireAuth,
  requireRole('agent', 'admin'),
  aiRateLimiter,
  validate({ params: customerIdParamSchema }),
  generateRecommendations
);

router.get(
  '/customers/:id/recommendations/latest',
  requireAuth,
  requireRole('agent', 'admin'),
  validate({ params: customerIdParamSchema }),
  getLatestRecommendations
);

export default router;
