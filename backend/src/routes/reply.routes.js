import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { ticketIdParamSchema } from '../validators/ticket.validator.js';
import {
  generateReplySchema,
  editDraftSchema,
  approveDraftSchema,
  draftIdParamSchema,
} from '../validators/reply.validator.js';
import {
  generateReply,
  editDraft,
  approveDraft,
} from '../controllers/reply.controller.js';

const router = Router();

// Staff: Generate AI Reply Draft
router.post(
  '/tickets/:id/replies/generate',
  requireAuth,
  requireRole('agent', 'admin'),
  aiRateLimiter,
  validate({ params: ticketIdParamSchema, body: generateReplySchema }),
  generateReply
);

// Staff: Edit Draft Text
router.patch(
  '/replies/:draftId',
  requireAuth,
  requireRole('agent', 'admin'),
  validate({ params: draftIdParamSchema, body: editDraftSchema }),
  editDraft
);

// Staff: Approve Draft & Send to Customer
router.post(
  '/replies/:draftId/approve',
  requireAuth,
  requireRole('agent', 'admin'),
  validate({ params: draftIdParamSchema, body: approveDraftSchema }),
  approveDraft
);

export default router;
