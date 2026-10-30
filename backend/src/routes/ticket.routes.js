import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
  ticketIdParamSchema,
  ticketMessageSchema,
  csatSchema,
} from '../validators/ticket.validator.js';
import {
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  addMessage,
  submitCsat,
  reanalyzeTicket,
} from '../controllers/ticket.controller.js';

const router = Router();

// Create ticket (Customer/All authenticated)
router.post(
  '/tickets',
  requireAuth,
  aiRateLimiter,
  validate({ body: createTicketSchema }),
  createTicket
);

// List tickets (Role-aware query)
router.get(
  '/tickets',
  requireAuth,
  validate({ query: listTicketsQuerySchema }),
  listTickets
);

// Get ticket detail
router.get(
  '/tickets/:id',
  requireAuth,
  validate({ params: ticketIdParamSchema }),
  getTicketById
);

// Staff update ticket (status, assign)
router.patch(
  '/tickets/:id',
  requireAuth,
  requireRole('agent', 'admin'),
  validate({ params: ticketIdParamSchema, body: updateTicketSchema }),
  updateTicket
);

// Add message to thread
router.post(
  '/tickets/:id/messages',
  requireAuth,
  validate({ params: ticketIdParamSchema, body: ticketMessageSchema }),
  addMessage
);

// Customer CSAT rating
router.post(
  '/tickets/:id/csat',
  requireAuth,
  validate({ params: ticketIdParamSchema, body: csatSchema }),
  submitCsat
);

// Staff re-analyze ticket with AI
router.post(
  '/tickets/:id/analyze',
  requireAuth,
  requireRole('agent', 'admin'),
  aiRateLimiter,
  validate({ params: ticketIdParamSchema }),
  reanalyzeTicket
);

export default router;
