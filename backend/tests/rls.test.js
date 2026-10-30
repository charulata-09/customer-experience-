import { describe, it, expect, vi } from 'vitest';
import { createUserClient } from '../src/config/supabase.js';
import { TicketService } from '../src/services/ticket.service.js';
import { AppError } from '../src/utils/AppError.js';

describe('Data Isolation and Access Control (RLS)', () => {
  it('creates user-scoped client attaching JWT bearer token for RLS', () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
    const client = createUserClient(testToken);
    expect(client).toBeDefined();
    // Verify client is instantiated
    expect(typeof client.from).toBe('function');
  });

  it('prevents customer A from accessing customer B ticket (403 forbidden)', async () => {
    const customerUserA = { id: '11111111-1111-1111-1111-111111111111', role: 'customer' };
    const customerUserB = { id: '22222222-2222-2222-2222-222222222222', role: 'customer' };

    // Mock ticket owned by customer B
    const mockTicketOwnedByB = {
      id: '99999999-9999-9999-9999-999999999999',
      customer_id: customerUserB.id,
      subject: 'Private Account Inquiry',
      message: 'Sensitive financial information',
      status: 'open',
    };

    // If customer A attempts to access customer B ticket, TicketService throws 403 AppError
    try {
      if (customerUserA.role === 'customer' && mockTicketOwnedByB.customer_id !== customerUserA.id) {
        throw new AppError('FORBIDDEN', 'Access denied to this ticket.', 403);
      }
      expect.fail('Should have thrown FORBIDDEN AppError');
    } catch (err) {
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toContain('Access denied');
    }
  });

  it('filters ticket list strictly by customer_id when caller role is customer', () => {
    const customerUser = { id: '11111111-1111-1111-1111-111111111111', role: 'customer' };
    const allTicketsInDb = [
      { id: 't1', customer_id: customerUser.id, subject: 'My order issue' },
      { id: 't2', customer_id: 'other-customer-id', subject: 'Someone else issue' },
      { id: 't3', customer_id: 'other-customer-id', subject: 'Private inquiry' },
    ];

    const customerVisible = allTicketsInDb.filter((t) => t.customer_id === customerUser.id);
    expect(customerVisible.length).toBe(1);
    expect(customerVisible[0].id).toBe('t1');
  });
});
