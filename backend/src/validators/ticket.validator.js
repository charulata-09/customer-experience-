import { z } from 'zod';
import {
  DOMAINS,
  CHANNELS,
  TICKET_STATUSES,
  URGENCIES,
  SENTIMENTS,
  PREFERRED_CONTACTS,
} from '../constants/enums.js';

export const createTicketSchema = z
  .object({
    domain: z.enum(DOMAINS, { errorMap: () => ({ message: 'Please select a valid domain' }) }),
    channel: z.enum(CHANNELS, { errorMap: () => ({ message: 'Please select a valid channel' }) }),
    subject: z.string().trim().min(5, 'Subject must be at least 5 characters').max(120, 'Subject cannot exceed 120 characters'),
    message: z.string().trim().min(20, 'Message must be at least 20 characters').max(3000, 'Message cannot exceed 3000 characters'),
    reference_id: z.string().trim().max(60).optional().nullable(),
    preferred_contact: z.enum(PREFERRED_CONTACTS).optional().nullable(),
  })
  .strict();

export const listTicketsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    status: z.enum(TICKET_STATUSES).optional(),
    urgency: z.enum(URGENCIES).optional(),
    sentiment: z.enum(SENTIMENTS).optional(),
    channel: z.enum(CHANNELS).optional(),
    domain: z.enum(DOMAINS).optional(),
    q: z.string().trim().optional(),
  })
  .strict();

export const updateTicketSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    assigned_agent_id: z.string().uuid().nullable().optional(),
  })
  .strict();

export const ticketIdParamSchema = z
  .object({
    id: z.string().uuid('Invalid ticket ID'),
  })
  .strict();

export const ticketMessageSchema = z
  .object({
    body: z.string().trim().min(1, 'Message cannot be empty').max(5000, 'Message cannot exceed 5000 characters'),
  })
  .strict();

export const csatSchema = z
  .object({
    rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    comment: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();
