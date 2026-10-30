import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createKbSchema,
  updateKbSchema,
  kbIdParamSchema,
  listKbQuerySchema,
} from '../validators/kb.validator.js';
import {
  listKbArticles,
  getKbArticle,
  createKbArticle,
  updateKbArticle,
  deleteKbArticle,
} from '../controllers/kb.controller.js';

const router = Router();

// Read articles (Auth all)
router.get('/kb', requireAuth, validate({ query: listKbQuerySchema }), listKbArticles);
router.get('/kb/:id', requireAuth, validate({ params: kbIdParamSchema }), getKbArticle);

// Admin only writes
router.post(
  '/kb',
  requireAuth,
  requireRole('admin'),
  validate({ body: createKbSchema }),
  createKbArticle
);

router.patch(
  '/kb/:id',
  requireAuth,
  requireRole('admin'),
  validate({ params: kbIdParamSchema, body: updateKbSchema }),
  updateKbArticle
);

router.delete(
  '/kb/:id',
  requireAuth,
  requireRole('admin'),
  validate({ params: kbIdParamSchema }),
  deleteKbArticle
);

export default router;
