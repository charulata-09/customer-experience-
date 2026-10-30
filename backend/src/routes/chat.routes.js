import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  createSessionSchema,
  chatMessageSchema,
  sessionIdParamSchema,
  escalateChatSchema,
} from '../validators/chat.validator.js';
import {
  createSession,
  getSession,
  sendMessage,
  escalateToTicket,
} from '../controllers/chat.controller.js';

const router = Router();

router.post(
  '/chat/sessions',
  requireAuth,
  validate({ body: createSessionSchema }),
  createSession
);

router.get(
  '/chat/sessions/:id',
  requireAuth,
  validate({ params: sessionIdParamSchema }),
  getSession
);

router.post(
  '/chat/sessions/:id/messages',
  requireAuth,
  aiRateLimiter,
  validate({ params: sessionIdParamSchema, body: chatMessageSchema }),
  sendMessage
);

router.post(
  '/chat/sessions/:id/escalate',
  requireAuth,
  validate({ params: sessionIdParamSchema, body: escalateChatSchema }),
  escalateToTicket
);

export default router;
