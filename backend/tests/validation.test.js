import { describe, it, expect } from 'vitest';
import {
  createTicketSchema,
  updateTicketSchema,
  csatSchema,
  ticketMessageSchema,
} from '../src/validators/ticket.validator.js';
import { updateProfileSchema, updateRoleSchema } from '../src/validators/auth.validator.js';
import { generateReplySchema, editDraftSchema } from '../src/validators/reply.validator.js';
import { chatMessageSchema, createSessionSchema } from '../src/validators/chat.validator.js';

describe('Zod Input Validators', () => {
  describe('createTicketSchema', () => {
    it('accepts valid ticket submission', () => {
      const valid = {
        domain: 'ecommerce',
        channel: 'web',
        subject: 'My shipment has not arrived yet',
        message: 'I placed this order five days ago with expedited shipping and the tracking has not updated since Tuesday.',
        reference_id: 'ORD-12345',
        preferred_contact: 'email',
      };
      const result = createTicketSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects message shorter than 20 characters', () => {
      const invalid = {
        domain: 'ecommerce',
        channel: 'web',
        subject: 'My shipment has not arrived',
        message: 'Too short message',
      };
      const result = createTicketSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('at least 20 characters');
    });

    it('rejects unknown fields with .strict()', () => {
      const withExtra = {
        domain: 'ecommerce',
        channel: 'web',
        subject: 'My shipment has not arrived yet',
        message: 'I placed this order five days ago with expedited shipping and the tracking has not updated.',
        malicious_extra_field: 'should_fail',
      };
      const result = createTicketSchema.safeParse(withExtra);
      expect(result.success).toBe(false);
    });
  });

  describe('csatSchema', () => {
    it('accepts ratings 1 to 5', () => {
      expect(csatSchema.safeParse({ rating: 5, comment: 'Great service' }).success).toBe(true);
      expect(csatSchema.safeParse({ rating: 1 }).success).toBe(true);
    });

    it('rejects ratings outside 1-5', () => {
      expect(csatSchema.safeParse({ rating: 0 }).success).toBe(false);
      expect(csatSchema.safeParse({ rating: 6 }).success).toBe(false);
    });
  });

  describe('auth & profile validators', () => {
    it('validates role enum strictly', () => {
      expect(updateRoleSchema.safeParse({ role: 'agent' }).success).toBe(true);
      expect(updateRoleSchema.safeParse({ role: 'admin' }).success).toBe(true);
      expect(updateRoleSchema.safeParse({ role: 'superadmin' }).success).toBe(false);
    });

    it('validates full_name bounds', () => {
      expect(updateProfileSchema.safeParse({ full_name: 'A' }).success).toBe(false);
      expect(updateProfileSchema.safeParse({ full_name: 'Alex Johnson' }).success).toBe(true);
    });
  });

  describe('chat validators', () => {
    it('validates chat message content', () => {
      expect(chatMessageSchema.safeParse({ content: '' }).success).toBe(false);
      expect(chatMessageSchema.safeParse({ content: 'Hello, need help!' }).success).toBe(true);
    });
  });
});
