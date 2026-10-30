import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateProfileSchema, updateRoleSchema, userIdParamSchema } from '../validators/auth.validator.js';
import { getMe, updateMe, updateUserRole } from '../controllers/auth.controller.js';

const router = Router();

router.get('/auth/me', requireAuth, getMe);
router.patch('/auth/me', requireAuth, validate({ body: updateProfileSchema }), updateMe);

router.patch(
  '/admin/users/:id/role',
  requireAuth,
  requireRole('admin'),
  validate({ params: userIdParamSchema, body: updateRoleSchema }),
  updateUserRole
);

export default router;
