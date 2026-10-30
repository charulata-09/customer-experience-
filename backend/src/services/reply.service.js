import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { KbService } from './kb.service.js';
import { generateStructured } from './gemini.service.js';
import { getSystemPrompt } from '../ai/prompts/system.js';
import { buildReplyPrompt } from '../ai/prompts/reply.prompt.js';
import { generateReplyResponseSchema } from '../ai/schemas/reply.schema.js';
import { replyOutputSchema } from '../validators/ai.validator.js';

export class ReplyService {
  /**
   * Draft a personalized AI reply grounded in KB and conversation history
   */
  static async generateReply(ticketId, options, staffUser) {
    // 1. Fetch ticket details + analysis + customer profile
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*, customer:customer_id(full_name), analysis:ticket_analyses(*)')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new AppError('TICKET_NOT_FOUND', 'Ticket not found.', 404);
    }

    // 2. Fetch conversation thread
    const { data: messages } = await supabaseAdmin
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // 3. Fetch brand settings
    const { data: brand } = await supabaseAdmin.from('brand_settings').select('*').single();

    const selectedTone = options.tone || brand?.default_tone || 'empathetic';
    const customerFirstName = ticket.customer?.full_name?.split(' ')[0] || 'Customer';

    // 4. Retrieve top 3 relevant KB articles
    const kbArticles = await KbService.findRelevantArticles({
      domain: ticket.domain,
      category: ticket.analysis?.category || 'general_inquiry',
      limit: 3,
    });

    const systemPrompt = getSystemPrompt(brand || {});
    const userPrompt = buildReplyPrompt({
      tone: selectedTone,
      language: 'English',
      maxWords: options.max_reply_words || 160,
      includeCompensation: Boolean(options.include_compensation_suggestion),
      firstName: customerFirstName,
      ticket: {
        subject: ticket.subject,
        message: ticket.message,
        category: ticket.analysis?.category,
        urgency: ticket.analysis?.urgency,
        sentiment: ticket.analysis?.sentiment,
        emotions: ticket.analysis?.emotions,
      },
      conversation: messages || [],
      kbArticles,
    });

    const aiResult = await generateStructured({
      systemInstruction: systemPrompt,
      prompt: userPrompt,
      responseSchema: generateReplyResponseSchema,
      temperature: 0.5,
      feature: 'generate_reply',
      userId: staffUser.id,
      validator: replyOutputSchema,
    });

    // 5. Save draft in ai_reply_drafts
    const validKbIds = (aiResult.kb_article_ids_used || []).filter((id) =>
      kbArticles.some((k) => k.id === id)
    );

    const { data: draft, error: draftError } = await supabaseAdmin
      .from('ai_reply_drafts')
      .insert({
        ticket_id: ticketId,
        created_by: staffUser.id,
        tone: selectedTone,
        draft_text: aiResult.reply_text,
        suggested_actions: aiResult.suggested_actions || [],
        kb_article_ids: validKbIds,
        status: 'draft',
      })
      .select('*')
      .single();

    if (draftError || !draft) {
      logger.error({ draftError }, 'Failed to save AI reply draft');
      throw new AppError('SAVE_DRAFT_FAILED', 'Could not save AI reply draft.', 500);
    }

    return {
      draft,
      confidence: aiResult.confidence ?? 0.85,
      agent_notes: aiResult.agent_notes || '',
      grounded_kb_articles: kbArticles,
    };
  }

  /**
   * Edit draft text before approval
   */
  static async editDraft(draftId, draftText, staffUser) {
    const { data: updated, error } = await supabaseAdmin
      .from('ai_reply_drafts')
      .update({
        draft_text: draftText,
      })
      .eq('id', draftId)
      .eq('status', 'draft')
      .select('*')
      .single();

    if (error || !updated) {
      throw new AppError('EDIT_DRAFT_FAILED', 'Could not update draft.', 400);
    }
    return updated;
  }

  /**
   * Approve AI draft: publishes to ticket thread as agent message and updates status
   */
  static async approveDraft(draftId, statusAfter, staffUser) {
    const { data: draft, error: fetchErr } = await supabaseAdmin
      .from('ai_reply_drafts')
      .select('*, ticket:ticket_id(*)')
      .eq('id', draftId)
      .single();

    if (fetchErr || !draft) {
      throw new AppError('DRAFT_NOT_FOUND', 'Draft not found.', 404);
    }

    // 1. Update draft status
    await supabaseAdmin
      .from('ai_reply_drafts')
      .update({
        status: 'approved',
        approved_by: staffUser.id,
      })
      .eq('id', draftId);

    // 2. Insert into ticket_messages
    const { data: message, error: msgErr } = await supabaseAdmin
      .from('ticket_messages')
      .insert({
        ticket_id: draft.ticket_id,
        sender_id: staffUser.id,
        sender_type: 'agent',
        body: draft.draft_text,
      })
      .select('*, sender:sender_id(full_name, role)')
      .single();

    if (msgErr) {
      logger.error({ msgErr }, 'Failed to post approved reply into thread');
      throw new AppError('POST_MESSAGE_FAILED', 'Could not publish reply into thread.', 500);
    }

    // 3. Update ticket status
    const newStatus = statusAfter === 'resolved' ? 'resolved' : 'awaiting_customer';
    const updateTicketPayload = { status: newStatus };
    if (newStatus === 'resolved') {
      updateTicketPayload.resolved_at = new Date().toISOString();
    }

    await supabaseAdmin
      .from('tickets')
      .update(updateTicketPayload)
      .eq('id', draft.ticket_id);

    return {
      message,
      draftStatus: 'approved',
      newTicketStatus: newStatus,
    };
  }
}
