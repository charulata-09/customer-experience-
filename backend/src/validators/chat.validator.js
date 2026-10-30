import { z } from 'zod';
import { DOMAINS } from '../constants/enums.js';

export const createSessionSchema = z
  .object({
    domain: z.enum(DOMAINS).default('ecommerce'),
  })
  .strict();

export const chatMessageSchema = z
  .object({
    content: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message cannot exceed 1000 characters'),
  })
  .strict();

export const sessionIdParamSchema = z
  .object({
    id: z.string().uuid('Invalid chat session ID'),
  })
  .strict();

export const escalateChatSchema = z
  .object({
    subject: z.string().trim().min(5).max(120).optional(),
    preferred_contact: z.enum(['email', 'phone', 'in_app']).optional(),
  })
  .strict();
