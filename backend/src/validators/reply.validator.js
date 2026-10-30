import { z } from 'zod';
import { TONES, TICKET_STATUSES } from '../constants/enums.js';

export const generateReplySchema = z
  .object({
    tone: z.enum(TONES).optional(),
    include_compensation_suggestion: z.boolean().optional().default(false),
    max_reply_words: z.coerce.number().int().min(40).max(500).optional().default(160),
  })
  .strict();

export const editDraftSchema = z
  .object({
    draft_text: z.string().trim().min(5, 'Draft text must be at least 5 characters').max(3000),
  })
  .strict();

export const approveDraftSchema = z
  .object({
    status_after: z.enum(['awaiting_customer', 'resolved']).optional().default('awaiting_customer'),
  })
  .strict();

export const draftIdParamSchema = z
  .object({
    draftId: z.string().uuid('Invalid draft ID'),
  })
  .strict();
