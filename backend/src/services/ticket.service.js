import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { generateStructured } from './gemini.service.js';
import { getSystemPrompt } from '../ai/prompts/system.js';
import { buildAnalyzePrompt } from '../ai/prompts/analyze.prompt.js';
import { analyzeTicketResponseSchema } from '../ai/schemas/analyze.schema.js';
import { analysisOutputSchema } from '../validators/ai.validator.js';

export class TicketService {
  /**
   * Create a new ticket, save first thread message, and trigger AI analysis
   */
  static async createTicket(customerUser, ticketData) {
    const { domain, channel, subject, message, reference_id, preferred_contact } = ticketData;

    // 1. Insert ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        customer_id: customerUser.id,
        domain,
        channel,
        subject,
        message,
        reference_id: reference_id || null,
        preferred_contact: preferred_contact || null,
        status: 'open',
      })
      .select('*')
      .single();

    if (ticketError || !ticket) {
      logger.error({ ticketError }, 'Failed to insert ticket');
      throw new AppError('CREATE_TICKET_FAILED', 'Could not create ticket.', 400);
    }

    // 2. Insert initial thread message
    await supabaseAdmin.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: customerUser.id,
      sender_type: 'customer',
      body: message,
    });

    // 3. Trigger AI analysis with 25s timeout and graceful fallback
    let analysis = null;
    try {
      // Fetch customer history for grounding
      const { data: pastTickets } = await supabaseAdmin
        .from('tickets')
        .select('id, status, ticket_analyses(sentiment)')
        .eq('customer_id', customerUser.id)
        .neq('id', ticket.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const historyCount = pastTickets ? pastTickets.length : 0;
      const recentSentiments = (pastTickets || [])
        .map((t) => t.ticket_analyses?.sentiment)
        .filter(Boolean);
      const unresolvedCount = (pastTickets || []).filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;

      // Fetch brand settings
      const { data: brand } = await supabaseAdmin.from('brand_settings').select('*').single();

      const systemPrompt = getSystemPrompt(brand || {});
      const userPrompt = buildAnalyzePrompt({
        domain,
        channel,
        subject,
        reference_id,
        message,
        history: {
          previous_tickets_count: historyCount,
          recent_sentiments: recentSentiments,
          unresolved_tickets: unresolvedCount,
        },
      });

      const aiResult = await generateStructured({
        systemInstruction: systemPrompt,
        prompt: userPrompt,
        responseSchema: analyzeTicketResponseSchema,
        temperature: 0.1,
        feature: 'analyze_ticket',
        userId: customerUser.id,
        validator: analysisOutputSchema,
      });

      // Upsert analysis
      const { data: savedAnalysis, error: analysisError } = await supabaseAdmin
        .from('ticket_analyses')
        .upsert(
          {
            ticket_id: ticket.id,
            sentiment: aiResult.sentiment,
            sentiment_score: aiResult.sentiment_score,
            intent: aiResult.intent,
            category: aiResult.category,
            urgency: aiResult.urgency,
            churn_risk: aiResult.churn_risk,
            emotions: aiResult.emotions,
            key_entities: aiResult.key_entities,
            summary: aiResult.summary,
            escalate: aiResult.escalate,
            escalation_reason: aiResult.escalation_reason || null,
            model: 'gemini-2.5-flash',
          },
          { onConflict: 'ticket_id' }
        )
        .select('*')
        .single();

      if (!analysisError) {
        analysis = savedAnalysis;
      }
    } catch (aiErr) {
      logger.warn({ err: aiErr.message }, 'AI ticket analysis timed out or failed; saving fallback status');
      // Graceful fallback row so UI displays pending
      const { data: fallbackAnalysis } = await supabaseAdmin
        .from('ticket_analyses')
        .upsert(
          {
            ticket_id: ticket.id,
            sentiment: 'neutral',
            sentiment_score: 0,
            intent: 'inquiry',
            category: 'general_inquiry',
            urgency: 'medium',
            churn_risk: 10,
            emotions: ['neutral'],
            key_entities: [],
            summary: 'Analysis pending review.',
            escalate: false,
            model: 'gemini-2.5-flash',
          },
          { onConflict: 'ticket_id' }
        )
        .select('*')
        .single();
      analysis = fallbackAnalysis;
    }

    return {
      ...ticket,
      analysis,
    };
  }

  /**
   * List tickets with pagination, filters, and role enforcement
   */
  static async listTickets(user, query) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    let queryBuilder = supabaseAdmin
      .from('tickets')
      .select(
        `
        *,
        customer:customer_id (id, full_name, email),
        assigned_agent:assigned_agent_id (id, full_name, email),
        analysis:ticket_analyses (*)
      `,
        { count: 'exact' }
      );

    // If customer, only view own tickets
    if (user.role === 'customer') {
      queryBuilder = queryBuilder.eq('customer_id', user.id);
    }

    // Filters
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }
    if (query.domain) {
      queryBuilder = queryBuilder.eq('domain', query.domain);
    }
    if (query.channel) {
      queryBuilder = queryBuilder.eq('channel', query.channel);
    }
    if (query.q) {
      queryBuilder = queryBuilder.or(`subject.ilike.%${query.q}%,message.ilike.%${query.q}%`);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: tickets, count, error } = await queryBuilder;

    if (error) {
      logger.error({ error }, 'Failed to list tickets');
      throw new AppError('QUERY_TICKETS_FAILED', error.message, 400);
    }

    // Additional client-side filter for analysis fields if joined
    let filteredTickets = tickets || [];
    if (query.urgency) {
      filteredTickets = filteredTickets.filter((t) => t.analysis?.urgency === query.urgency);
    }
    if (query.sentiment) {
      filteredTickets = filteredTickets.filter((t) => t.analysis?.sentiment === query.sentiment);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      tickets: filteredTickets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get single ticket with full thread, analysis, drafts, and CSAT
   */
  static async getTicketById(user, ticketId) {
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(
        `
        *,
        customer:customer_id (id, full_name, email, avatar_url),
        assigned_agent:assigned_agent_id (id, full_name, email, avatar_url),
        analysis:ticket_analyses (*),
        csat:csat_feedback (*)
      `
      )
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new AppError('TICKET_NOT_FOUND', 'Ticket not found.', 404);
    }

    // Access control: customer can only view own ticket
    if (user.role === 'customer' && ticket.customer_id !== user.id) {
      throw new AppError('FORBIDDEN', 'Access denied to this ticket.', 403);
    }

    // Fetch messages thread
    const { data: messages } = await supabaseAdmin
      .from('ticket_messages')
      .select(
        `
        *,
        sender:sender_id (id, full_name, role, avatar_url)
      `
      )
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Fetch AI reply drafts (staff only)
    let drafts = [];
    if (user.role !== 'customer') {
      const { data: draftList } = await supabaseAdmin
        .from('ai_reply_drafts')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
      drafts = draftList || [];
    }

    return {
      ticket,
      analysis: ticket.analysis || null,
      messages: messages || [],
      drafts,
      csat: ticket.csat || null,
    };
  }

  /**
   * Update ticket status or assigned agent (Staff only)
   */
  static async updateTicket(ticketId, updates, staffUser) {
    const updatePayload = {};
    if (updates.status !== undefined) {
      updatePayload.status = updates.status;
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updatePayload.resolved_at = new Date().toISOString();
      }
    }
    if (updates.assigned_agent_id !== undefined) {
      updatePayload.assigned_agent_id = updates.assigned_agent_id;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('tickets')
      .update(updatePayload)
      .eq('id', ticketId)
      .select('*')
      .single();

    if (error || !updated) {
      throw new AppError('UPDATE_TICKET_FAILED', 'Failed to update ticket.', 400);
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: staffUser.id,
      action: 'UPDATE_TICKET',
      entity: 'tickets',
      entity_id: ticketId,
      metadata: updatePayload,
    });

    return updated;
  }

  /**
   * Add message to ticket thread
   */
  static async addMessage(ticketId, user, body) {
    // Verify ticket exists and access
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, customer_id, status')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new AppError('TICKET_NOT_FOUND', 'Ticket not found.', 404);
    }

    if (user.role === 'customer' && ticket.customer_id !== user.id) {
      throw new AppError('FORBIDDEN', 'Access denied to this ticket.', 403);
    }

    const senderType = user.role === 'customer' ? 'customer' : 'agent';

    const { data: message, error: messageError } = await supabaseAdmin
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_type: senderType,
        body,
      })
      .select('*, sender:sender_id (id, full_name, role, avatar_url)')
      .single();

    if (messageError || !message) {
      throw new AppError('MESSAGE_FAILED', 'Failed to send message.', 400);
    }

    // If customer replies to an awaiting_customer ticket, set back to in_progress
    if (senderType === 'customer' && ticket.status === 'awaiting_customer') {
      await supabaseAdmin
        .from('tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticketId);
    }

    return message;
  }

  /**
   * Submit CSAT rating (Customer only, for resolved/closed tickets)
   */
  static async submitCsat(ticketId, customerUser, rating, comment) {
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('id, customer_id, status')
      .eq('id', ticketId)
      .single();

    if (!ticket || ticket.customer_id !== customerUser.id) {
      throw new AppError('FORBIDDEN', 'Cannot submit feedback for this ticket.', 403);
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      throw new AppError(
        'INVALID_STATUS',
        'CSAT rating can only be submitted for resolved or closed tickets.',
        400
      );
    }

    const { data: csat, error } = await supabaseAdmin
      .from('csat_feedback')
      .upsert(
        {
          ticket_id: ticketId,
          customer_id: customerUser.id,
          rating,
          comment: comment || null,
        },
        { onConflict: 'ticket_id' }
      )
      .select('*')
      .single();

    if (error) {
      throw new AppError('CSAT_FAILED', 'Failed to save CSAT rating.', 400);
    }

    return csat;
  }

  /**
   * Re-run AI analysis on existing ticket (Staff only)
   */
  static async reanalyzeTicket(ticketId, staffUser) {
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      throw new AppError('TICKET_NOT_FOUND', 'Ticket not found.', 404);
    }

    const { data: brand } = await supabaseAdmin.from('brand_settings').select('*').single();
    const systemPrompt = getSystemPrompt(brand || {});

    const userPrompt = buildAnalyzePrompt({
      domain: ticket.domain,
      channel: ticket.channel,
      subject: ticket.subject,
      reference_id: ticket.reference_id,
      message: ticket.message,
      history: {},
    });

    const aiResult = await generateStructured({
      systemInstruction: systemPrompt,
      prompt: userPrompt,
      responseSchema: analyzeTicketResponseSchema,
      temperature: 0.1,
      feature: 'analyze_ticket',
      userId: staffUser.id,
      validator: analysisOutputSchema,
    });

    const { data: analysis, error } = await supabaseAdmin
      .from('ticket_analyses')
      .upsert(
        {
          ticket_id: ticketId,
          sentiment: aiResult.sentiment,
          sentiment_score: aiResult.sentiment_score,
          intent: aiResult.intent,
          category: aiResult.category,
          urgency: aiResult.urgency,
          churn_risk: aiResult.churn_risk,
          emotions: aiResult.emotions,
          key_entities: aiResult.key_entities,
          summary: aiResult.summary,
          escalate: aiResult.escalate,
          escalation_reason: aiResult.escalation_reason || null,
          model: 'gemini-2.5-flash',
        },
        { onConflict: 'ticket_id' }
      )
      .select('*')
      .single();

    if (error) {
      throw new AppError('REANALYZE_FAILED', 'Failed to save re-analysis.', 400);
    }

    return analysis;
  }
}
