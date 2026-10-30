import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export class AnalyticsService {
  /**
   * Aggregate high-level KPIs across the platform
   */
  static async getOverviewKpis({ from, to } = {}) {
    let ticketQuery = supabaseAdmin
      .from('tickets')
      .select('id, status, created_at, resolved_at, analysis:ticket_analyses(sentiment_score, churn_risk)');

    if (from) ticketQuery = ticketQuery.gte('created_at', from);
    if (to) ticketQuery = ticketQuery.lte('created_at', to);

    const { data: tickets, error } = await ticketQuery;
    if (error) {
      logger.error({ error }, 'Failed to fetch overview tickets');
    }

    const ticketList = tickets || [];
    const totalTickets = ticketList.length;

    // Open tickets
    const openTickets = ticketList.filter((t) =>
      ['open', 'in_progress', 'awaiting_customer'].includes(t.status)
    ).length;

    // High churn risk
    const highChurnRiskCount = ticketList.filter(
      (t) => (t.analysis?.churn_risk ?? 0) >= 70
    ).length;

    // Average sentiment score
    const scores = ticketList
      .map((t) => t.analysis?.sentiment_score)
      .filter((s) => s !== null && s !== undefined);
    const avgSentiment = scores.length > 0 ? scores.reduce((a, b) => a + Number(b), 0) / scores.length : 0;

    // Average resolution time (hours)
    const resolvedWithDuration = ticketList
      .filter((t) => t.resolved_at && t.created_at)
      .map((t) => (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60));
    const avgResolutionHours =
      resolvedWithDuration.length > 0
        ? resolvedWithDuration.reduce((a, b) => a + b, 0) / resolvedWithDuration.length
        : 0;

    // Average CSAT rating
    const { data: csatList } = await supabaseAdmin.from('csat_feedback').select('rating');
    const csatRatings = (csatList || []).map((c) => c.rating);
    const avgCsat =
      csatRatings.length > 0
        ? csatRatings.reduce((a, b) => a + b, 0) / csatRatings.length
        : 0;

    return {
      totalTickets,
      openTickets,
      highChurnRiskCount,
      avgSentimentScore: Number(avgSentiment.toFixed(2)),
      avgCsat: Number(avgCsat.toFixed(1)),
      avgResolutionHours: Number(avgResolutionHours.toFixed(1)),
      csatResponsesCount: csatRatings.length,
    };
  }

  /**
   * Sentiment score over time trend (last 14 or 30 days)
   */
  static async getSentimentTrend() {
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('created_at, analysis:ticket_analyses(sentiment_score, sentiment)')
      .order('created_at', { ascending: true });

    // Group by date YYYY-MM-DD
    const dateMap = {};
    (tickets || []).forEach((t) => {
      const date = t.created_at.slice(0, 10);
      if (!dateMap[date]) {
        dateMap[date] = { date, scores: [], count: 0 };
      }
      dateMap[date].count += 1;
      if (t.analysis?.sentiment_score !== undefined && t.analysis?.sentiment_score !== null) {
        dateMap[date].scores.push(Number(t.analysis.sentiment_score));
      }
    });

    const trend = Object.values(dateMap).map((d) => ({
      date: d.date,
      tickets: d.count,
      avgSentiment:
        d.scores.length > 0
          ? Number((d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(2))
          : 0,
    }));

    return trend;
  }

  /**
   * Distribution of tickets by category
   */
  static async getCategoriesDistribution() {
    const { data: analyses } = await supabaseAdmin
      .from('ticket_analyses')
      .select('category');

    const counts = {};
    (analyses || []).forEach((a) => {
      const cat = a.category || 'general_inquiry';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
    }));
  }

  /**
   * Distribution of tickets by urgency level
   */
  static async getUrgencyDistribution() {
    const { data: analyses } = await supabaseAdmin
      .from('ticket_analyses')
      .select('urgency');

    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    (analyses || []).forEach((a) => {
      const urg = a.urgency || 'medium';
      if (counts[urg] !== undefined) counts[urg] += 1;
    });

    return Object.entries(counts).map(([urgency, count]) => ({
      urgency,
      count,
    }));
  }

  /**
   * Distribution of tickets by intake channel
   */
  static async getChannelsDistribution() {
    const { data: tickets } = await supabaseAdmin.from('tickets').select('channel');

    const counts = {};
    (tickets || []).forEach((t) => {
      const ch = t.channel || 'web';
      counts[ch] = (counts[ch] || 0) + 1;
    });

    return Object.entries(counts).map(([channel, count]) => ({
      channel,
      count,
    }));
  }
}
