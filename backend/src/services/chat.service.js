import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { KbService } from './kb.service.js';
import { TicketService } from './ticket.service.js';
import { generateStructured } from './gemini.service.js';
import { getSystemPrompt } from '../ai/prompts/system.js';
import { buildChatPrompt } from '../ai/prompts/chat.prompt.js';
import { chatAssistantResponseSchema } from '../ai/schemas/chat.schema.js';
import { chatOutputSchema } from '../validators/ai.validator.js';

export class ChatService {
  /**
   * Start a new chat assistant session
   */
  static async createSession(customerId, domain = 'ecommerce') {
    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        customer_id: customerId,
        domain,
      })
      .select('*')
      .single();

    if (error || !session) {
      logger.error({ error }, 'Failed to create chat session');
      throw new AppError('CREATE_SESSION_FAILED', 'Could not start chat session.', 400);
    }

    // Insert friendly initial greeting
    await supabaseAdmin.from('chat_messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: `Hello! I'm CX Copilot, your AI support assistant for ${domain.replace('_', ' ')}. How can I assist you today?`,
    });

    return session;
  }

  /**
   * Fetch chat session with all messages
   */
  static async getSession(sessionId, user) {
    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      throw new AppError('SESSION_NOT_FOUND', 'Chat session not found.', 404);
    }

    if (user.role === 'customer' && session.customer_id !== user.id) {
      throw new AppError('FORBIDDEN', 'Access denied to this chat session.', 403);
    }

    const { data: messages } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    return {
      session,
      messages: messages || [],
    };
  }

  /**
   * Send message in session and get AI assistant reply
   */
  static async sendMessage(sessionId, customerUser, content) {
    // 1. Verify session
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionErr || !session) {
      throw new AppError('SESSION_NOT_FOUND', 'Chat session not found.', 404);
    }

    if (customerUser.role === 'customer' && session.customer_id !== customerUser.id) {
      throw new AppError('FORBIDDEN', 'Access denied to this chat session.', 403);
    }

    // 2. Insert user message
    const { data: userMsg, error: userMsgErr } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content,
      })
      .select('*')
      .single();

    if (userMsgErr) {
      throw new AppError('SEND_MESSAGE_FAILED', 'Failed to save message.', 400);
    }

    // 3. Fetch past messages for context
    const { data: pastMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // 4. Retrieve KB articles for grounding
    const kbArticles = await KbService.findRelevantArticles({
      domain: session.domain,
      limit: 3,
    });

    // 5. Fetch brand settings
    const { data: brand } = await supabaseAdmin.from('brand_settings').select('*').single();

    const systemPrompt = getSystemPrompt(brand || {});
    const userPrompt = buildChatPrompt({
      domain: session.domain,
      latestMessage: content,
      history: pastMessages || [],
      kbArticles,
    });

    const aiResult = await generateStructured({
      systemInstruction: systemPrompt,
      prompt: userPrompt,
      responseSchema: chatAssistantResponseSchema,
      temperature: 0.6,
      feature: 'chat_assistant',
      userId: customerUser.id,
      validator: chatOutputSchema,
    });

    // 6. Save assistant reply
    const { data: assistantMsg } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResult.reply,
      })
      .select('*')
      .single();

    return {
      message: assistantMsg,
      escalate_suggested: aiResult.escalate_suggested,
      detected_sentiment: aiResult.detected_sentiment,
      quick_replies: aiResult.quick_replies || [],
    };
  }

  /**
   * Convert chat conversation into a formal ticket
   */
  static async escalateToTicket(sessionId, customerUser, options = {}) {
    const { data: session } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session || (customerUser.role === 'customer' && session.customer_id !== customerUser.id)) {
      throw new AppError('FORBIDDEN', 'Cannot escalate this chat session.', 403);
    }

    if (session.escalated_ticket_id) {
      return {
        ticket_id: session.escalated_ticket_id,
        already_escalated: true,
      };
    }

    // Fetch conversation thread
    const { data: messages } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const customerInquiries = (messages || [])
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n---\n');

    const subject =
      options.subject ||
      `Escalated Chat Support Request (${session.domain.replace('_', ' ')})`;

    const ticket = await TicketService.createTicket(customerUser, {
      domain: session.domain,
      channel: 'chat',
      subject,
      message: customerInquiries || 'Customer requested escalation to a human support agent.',
      preferred_contact: options.preferred_contact || 'in_app',
    });

    // Link back to chat_session
    await supabaseAdmin
      .from('chat_sessions')
      .update({ escalated_ticket_id: ticket.id })
      .eq('id', sessionId);

    // Add confirmation message to chat
    await supabaseAdmin.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: `I have escalated this issue to our support team as Ticket #${ticket.id.slice(
        0,
        8
      )}. A human specialist has been notified and will review your conversation history.`,
    });

    return ticket;
  }
}
