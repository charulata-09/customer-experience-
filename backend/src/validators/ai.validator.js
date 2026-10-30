import { z } from 'zod';
import {
  SENTIMENTS,
  INTENTS,
  CATEGORIES,
  URGENCIES,
  EMOTIONS,
  TONES,
  RISK_LEVELS,
  HEALTH_TRENDS,
  EFFORT_LEVELS,
} from '../constants/enums.js';

export const analysisOutputSchema = z.object({
  sentiment: z.enum(SENTIMENTS),
  sentiment_score: z.number().min(-1).max(1),
  intent: z.enum(INTENTS),
  category: z.enum(CATEGORIES),
  urgency: z.enum(URGENCIES),
  churn_risk: z.number().int().min(0).max(100),
  emotions: z.array(z.enum(EMOTIONS)),
  key_entities: z.array(
    z.object({
      type: z.string(),
      value: z.string(),
    })
  ),
  summary: z.string().max(300),
  escalate: z.boolean(),
  escalation_reason: z.string().nullable().optional(),
});

export const replyOutputSchema = z.object({
  reply_text: z.string().min(5),
  tone_used: z.enum(TONES),
  kb_article_ids_used: z.array(z.string()).default([]),
  suggested_actions: z.array(
    z.object({
      action: z.string(),
      reason: z.string(),
      requires_approval: z.boolean(),
    })
  ),
  confidence: z.number().min(0).max(1),
  agent_notes: z.string().optional().default(''),
});

export const chatOutputSchema = z.object({
  reply: z.string().min(1),
  escalate_suggested: z.boolean(),
  detected_sentiment: z.enum(SENTIMENTS),
  quick_replies: z.array(z.string()).default([]),
});

export const recommendationOutputSchema = z.object({
  health_score: z.number().int().min(0).max(100),
  risk_level: z.enum(RISK_LEVELS),
  headline: z.string(),
  recommendations: z.array(
    z.object({
      priority: z.number(),
      action: z.string(),
      channel: z.enum(['email', 'phone', 'in_app', 'social']),
      timing: z.string(),
      expected_impact: z.string(),
      needs_approval: z.boolean(),
    })
  ),
});

export const insightOutputSchema = z.object({
  executive_summary: z.string(),
  overall_health: z.enum(HEALTH_TRENDS),
  pain_points: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      severity: z.enum(URGENCIES),
      evidence: z.string(),
      root_cause_hypothesis: z.string(),
    })
  ),
  trends: z.array(z.string()),
  recommendations: z.array(
    z.object({
      action: z.string(),
      owner_suggestion: z.string(),
      effort: z.enum(EFFORT_LEVELS),
      expected_outcome: z.string(),
    })
  ),
  kb_gaps: z.array(z.string()),
});
