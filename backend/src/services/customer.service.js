import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { generateStructured } from './gemini.service.js';
import { getSystemPrompt } from '../ai/prompts/system.js';
import { buildRecommendPrompt } from '../ai/prompts/recommend.prompt.js';
import { recommendActionsResponseSchema } from '../ai/schemas/recommend.schema.js';
import { recommendationOutputSchema } from '../validators/ai.validator.js';

export class CustomerService {
  /**
   * 360 Customer Profile: account details, all past tickets, sentiments, CSAT ratings
   */
  static async getCustomerProfile(customerId) {
    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();

    if (profileErr || !profile) {
      throw new AppError('CUSTOMER_NOT_FOUND', 'Customer profile not found.', 404);
    }

    // 2. Fetch all tickets
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('*, analysis:ticket_analyses(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    // 3. Fetch CSAT ratings
    const { data: csatFeedbacks } = await supabaseAdmin
      .from('csat_feedback')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    // 4. Fetch latest AI recommendations
    const { data: recommendations } = await supabaseAdmin
      .from('customer_recommendations')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const ticketList = tickets || [];
    const csatList = csatFeedbacks || [];

    const sentimentScores = ticketList
      .map((t) => t.analysis?.sentiment_score)
      .filter((s) => s !== null && s !== undefined);
    const avgSentiment =
      sentimentScores.length > 0
        ? sentimentScores.reduce((a, b) => a + Number(b), 0) / sentimentScores.length
        : 0;

    const csatScores = csatList.map((c) => c.rating);
    const avgCsat =
      csatScores.length > 0
        ? csatScores.reduce((a, b) => a + Number(b), 0) / csatScores.length
        : null;

    const openCount = ticketList.filter((t) =>
      ['open', 'in_progress', 'awaiting_customer'].includes(t.status)
    ).length;

    return {
      profile,
      stats: {
        totalTickets: ticketList.length,
        openTickets: openCount,
        avgSentiment: Number(avgSentiment.toFixed(2)),
        avgCsat: avgCsat !== null ? Number(avgCsat.toFixed(1)) : 'N/A',
      },
      tickets: ticketList,
      csat: csatList,
      latestRecommendations: recommendations || null,
    };
  }

  /**
   * Run Gemini Next-Best-Action recommendation engine
   */
  static async generateRecommendations(customerId, staffUser) {
    const { profile, stats, tickets } = await this.getCustomerProfile(customerId);

    const { data: brand } = await supabaseAdmin.from('brand_settings').select('*').single();
    const systemPrompt = getSystemPrompt(brand || {});

    const firstName = profile.full_name?.split(' ')[0] || 'Customer';
    const memberSince = profile.created_at ? profile.created_at.slice(0, 10) : '2025-01-01';

    const historyItems = tickets.map((t) => ({
      subject: t.subject,
      category: t.analysis?.category,
      urgency: t.analysis?.urgency,
      sentiment: t.analysis?.sentiment,
      status: t.status,
    }));

    const userPrompt = buildRecommendPrompt({
      firstName,
      memberSince,
      totalTickets: stats.totalTickets,
      avgSentiment: stats.avgSentiment,
      csatAvg: stats.avgCsat,
      openTickets: stats.openTickets,
      ticketHistory: historyItems,
    });

    const aiResult = await generateStructured({
      systemInstruction: systemPrompt,
      prompt: userPrompt,
      responseSchema: recommendActionsResponseSchema,
      temperature: 0.4,
      feature: 'recommend_actions',
      userId: staffUser.id,
      validator: recommendationOutputSchema,
    });

    const { data: saved, error } = await supabaseAdmin
      .from('customer_recommendations')
      .insert({
        customer_id: customerId,
        recommendations: aiResult,
        health_score: aiResult.health_score,
      })
      .select('*')
      .single();

    if (error || !saved) {
      logger.error({ error }, 'Failed to save customer recommendations');
      throw new AppError('SAVE_RECOMMENDATIONS_FAILED', 'Could not save recommendations.', 500);
    }

    return saved;
  }

  static async getLatestRecommendations(customerId) {
    const { data, error } = await supabaseAdmin
      .from('customer_recommendations')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data || null;
  }
}
