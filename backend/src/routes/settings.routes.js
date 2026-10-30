import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { brandSettingsSchema } from '../validators/analytics.validator.js';
import {
  getBrandSettings,
  updateBrandSettings,
} from '../controllers/settings.controller.js';

const router = Router();

// Read brand settings (Any authenticated user)
router.get('/settings/brand', requireAuth, getBrandSettings);

// Update brand settings (Admin only)
router.put(
  '/settings/brand',
  requireAuth,
  requireRole('admin'),
  validate({ body: brandSettingsSchema }),
  updateBrandSettings
);

export default router;
