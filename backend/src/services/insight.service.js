import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { generateStructured } from './gemini.service.js';
import { getSystemPrompt } from '../ai/prompts/system.js';
import { buildInsightPrompt } from '../ai/prompts/insights.prompt.js';
import { generateInsightReportResponseSchema } from '../ai/schemas/insights.schema.js';
import { insightOutputSchema } from '../validators/ai.validator.js';

export class InsightService {
  /**
   * Compute metrics aggregates and generate executive AI insight report
   */
  static async generateReport({ period_start, period_end }, adminUser) {
    // 1. Fetch tickets within date range
    const { data: tickets, error: ticketErr } = await supabaseAdmin
      .from('tickets')
      .select('id, domain, channel, status, created_at, analysis:ticket_analyses(*)')
      .gte('created_at', `${period_start}T00:00:00Z`)
      .lte('created_at', `${period_end}T23:59:59Z`);

    if (ticketErr) {
      throw new AppError('FETCH_METRICS_FAILED', ticketErr.message, 400);
    }

    const ticketList = tickets || [];

    // 2. Compute aggregated metrics
    const categoryCounts = {};
    const urgencyCounts = {};
    const channelCounts = {};
    const sentimentScores = [];

    ticketList.forEach((t) => {
      const cat = t.analysis?.category || 'general_inquiry';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const urg = t.analysis?.urgency || 'medium';
      urgencyCounts[urg] = (urgencyCounts[urg] || 0) + 1;

      const ch = t.channel || 'web';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;

      if (t.analysis?.sentiment_score !== undefined && t.analysis?.sentiment_score !== null) {
        sentimentScores.push(Number(t.analysis.sentiment_score));
      }
    });

    const avgSentiment =
      sentimentScores.length > 0
        ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
        : 0;

    const metrics = {
      total_interactions: ticketList.length,
      average_sentiment_score: Number(avgSentiment.toFixed(2)),
      volume_by_category: categoryCounts,
      urgency_distribution: urgencyCounts,
      channels_mix: channelCounts,
    };

    // 3. Top negative ticket summaries
    const sampleNegative = ticketList
      .filter((t) => (t.analysis?.sentiment_score ?? 0) <= -0.2)
      .slice(0, 10)
      .map((t) => ({
        category: t.analysis?.category || 'general',
        summary: t.analysis?.summary || 'Customer complaint regarding service or product.',
      }));

    // 4. Brand settings
    const { data: brand } = await supabaseAdmin.from('brand_settings').select('*').single();

    const systemPrompt = getSystemPrompt(brand || {});
    const userPrompt = buildInsightPrompt({
      periodStart: period_start,
      periodEnd: period_end,
      metrics,
      sampleNegativeSummaries: sampleNegative,
    });

    const aiReport = await generateStructured({
      systemInstruction: systemPrompt,
      prompt: userPrompt,
      responseSchema: generateInsightReportResponseSchema,
      temperature: 0.3,
      feature: 'insight_report',
      userId: adminUser.id,
      validator: insightOutputSchema,
    });

    // 5. Save report into DB
    const { data: savedReport, error: saveErr } = await supabaseAdmin
      .from('insight_reports')
      .insert({
        created_by: adminUser.id,
        period_start,
        period_end,
        report: aiReport,
      })
      .select('*')
      .single();

    if (saveErr || !savedReport) {
      logger.error({ saveErr }, 'Failed to save insight report');
      throw new AppError('SAVE_REPORT_FAILED', 'Could not save insight report.', 500);
    }

    return savedReport;
  }

  static async listReports() {
    const { data, error } = await supabaseAdmin
      .from('insight_reports')
      .select('id, period_start, period_end, created_at, creator:created_by(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('LIST_REPORTS_FAILED', error.message, 400);
    }
    return data || [];
  }

  static async getReportById(id) {
    const { data, error } = await supabaseAdmin
      .from('insight_reports')
      .select('*, creator:created_by(full_name, email)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppError('REPORT_NOT_FOUND', 'Insight report not found.', 404);
    }
    return data;
  }
}
