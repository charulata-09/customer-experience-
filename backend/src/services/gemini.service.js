import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { supabaseAdmin } from '../config/supabase.js';

let aiClient = null;

const getAiClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClient;
};

// Log AI usage into audit table
export const logAiUsage = async ({
  userId = null,
  feature,
  model = env.GEMINI_MODEL,
  latency = 0,
  input = 0,
  output = 0,
  success = true,
  error = null,
}) => {
  try {
    await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: userId,
      feature,
      model,
      latency_ms: latency,
      input_chars: input,
      output_chars: output,
      success,
      error_message: error ? String(error) : null,
    });
  } catch (logErr) {
    logger.warn({ logErr: logErr.message }, 'Failed to persist ai_usage_log');
  }
};

/**
 * Generate structured JSON using Gemini SDK with validation, retry, and timeout
 */
export async function generateStructured({
  systemInstruction,
  prompt,
  responseSchema,
  temperature = 0.3,
  feature = 'structured_generation',
  userId = null,
  validator = null,
  fallbackValue = null,
}) {
  const started = Date.now();

  // If using placeholder key in development without real key, return fallback or mock
  if (env.GEMINI_API_KEY.includes('placeholder')) {
    logger.warn(`Using fallback mock for ${feature} because GEMINI_API_KEY is placeholder`);
    const mock = fallbackValue || getFallbackForFeature(feature);
    await logAiUsage({
      userId,
      feature,
      latency: 50,
      input: prompt.length,
      output: JSON.stringify(mock).length,
      success: true,
    });
    return mock;
  }

  const ai = getAiClient();

  const callModel = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);

    try {
      const response = await ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
          responseMimeType: 'application/json',
          responseSchema,
          maxOutputTokens: 2048,
          abortSignal: controller.signal,
        },
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  let rawResponse;
  try {
    rawResponse = await callModel();
  } catch (err) {
    // Retry once with exponential backoff on rate limit or service error
    if (err.status === 429 || err.status === 503 || (err.message && err.message.includes('429'))) {
      logger.warn(`Gemini rate limited on ${feature}. Retrying in 1.2 seconds...`);
      await new Promise((r) => setTimeout(r, 1200));
      try {
        rawResponse = await callModel();
      } catch (retryErr) {
        await logAiUsage({
          userId,
          feature,
          latency: Date.now() - started,
          input: prompt.length,
          output: 0,
          success: false,
          error: retryErr.message,
        });
        if (fallbackValue) return fallbackValue;
        throw new AppError('AI_SERVICE_ERROR', 'The AI service is temporarily unavailable.', 502);
      }
    } else {
      await logAiUsage({
        userId,
        feature,
        latency: Date.now() - started,
        input: prompt.length,
        output: 0,
        success: false,
        error: err.message,
      });
      if (fallbackValue) return fallbackValue;
      throw new AppError('AI_SERVICE_ERROR', 'The AI service is temporarily unavailable.', 502);
    }
  }

  const text = rawResponse.text || '{}';

  try {
    const parsed = JSON.parse(text);

    let validated = parsed;
    if (validator) {
      const validationResult = validator.safeParse(parsed);
      if (!validationResult.success) {
        logger.warn(
          { errors: validationResult.error.format() },
          `AI output validation failed for ${feature}`
        );
        if (fallbackValue) {
          validated = fallbackValue;
        } else {
          // Attempt clamping if basic structure is valid
          validated = sanitizeAndClampAiOutput(parsed, feature);
        }
      } else {
        validated = validationResult.data;
      }
    }

    await logAiUsage({
      userId,
      feature,
      latency: Date.now() - started,
      input: prompt.length,
      output: text.length,
      success: true,
    });

    return validated;
  } catch (jsonErr) {
    await logAiUsage({
      userId,
      feature,
      latency: Date.now() - started,
      input: prompt.length,
      output: text.length,
      success: false,
      error: `JSON Parse error: ${jsonErr.message}`,
    });
    if (fallbackValue) return fallbackValue;
    throw new AppError('AI_PARSING_ERROR', 'Failed to parse AI response.', 502);
  }
}

/**
 * Clamps numeric ranges and applies safe fallback for malformed output
 */
function sanitizeAndClampAiOutput(data, feature) {
  if (feature === 'analyze_ticket' && typeof data === 'object' && data !== null) {
    return {
      sentiment: data.sentiment || 'neutral',
      sentiment_score: Math.max(-1, Math.min(1, Number(data.sentiment_score) || 0)),
      intent: data.intent || 'question',
      category: data.category || 'general_inquiry',
      urgency: data.urgency || 'medium',
      churn_risk: Math.max(0, Math.min(100, Math.round(Number(data.churn_risk) || 20))),
      emotions: Array.isArray(data.emotions) ? data.emotions : ['neutral'],
      key_entities: Array.isArray(data.key_entities) ? data.key_entities : [],
      summary: String(data.summary || 'Customer submitted inquiry.'),
      escalate: Boolean(data.escalate),
      escalation_reason: data.escalation_reason || null,
    };
  }
  return data;
}

/**
 * Deterministic mock fallback when testing or developing without live API key
 */
function getFallbackForFeature(feature) {
  switch (feature) {
    case 'analyze_ticket':
      return {
        sentiment: 'negative',
        sentiment_score: -0.65,
        intent: 'complaint',
        category: 'delivery_logistics',
        urgency: 'high',
        churn_risk: 65,
        emotions: ['frustrated', 'disappointed'],
        key_entities: [{ type: 'order', value: 'ORDER-8921' }],
        summary: 'Customer reports severe shipment delay and requests immediate resolution.',
        escalate: false,
        escalation_reason: null,
      };
    case 'generate_reply':
      return {
        reply_text:
          'Thank you for reaching out to us. I understand how concerning it is when your order is delayed. We are actively investigating this with our carrier and will update you with the tracking details within 24 hours. The Acme Support Team',
        tone_used: 'empathetic',
        kb_article_ids_used: ['a0000000-0000-0000-0000-000000000002'],
        suggested_actions: [
          {
            action: 'Issue shipping fee refund',
            reason: 'Shipment delayed past delivery window',
            requires_approval: true,
          },
        ],
        confidence: 0.92,
        agent_notes: 'Verified against Standard Delivery Logistics KB Article.',
      };
    case 'chat_assistant':
      return {
        reply:
          'Hello! I would be glad to help you with that. You can view your current order status or request a replacement through our portal. If you need a human agent, just let me know!',
        escalate_suggested: false,
        detected_sentiment: 'neutral',
        quick_replies: ['Check order status', 'Talk to a human agent', 'Return policy'],
      };
    case 'recommend_actions':
      return {
        health_score: 68,
        risk_level: 'medium',
        headline: 'Customer relationship stable but strained due to recent delivery delays.',
        recommendations: [
          {
            priority: 1,
            action: 'Send personalized apology check-in email',
            channel: 'email',
            timing: 'Within 24 hours',
            expected_impact: 'Reduces churn risk by 15%',
            needs_approval: false,
          },
          {
            priority: 2,
            action: 'Offer $10 store credit goodwill voucher',
            channel: 'in_app',
            timing: 'Next login',
            expected_impact: 'Restores CSAT satisfaction rating',
            needs_approval: true,
          },
        ],
      };
    case 'insight_report':
      return {
        executive_summary:
          'Overall customer experience remained stable across the evaluated period, with shipping delays and recurring refund requests accounting for 64% of high-urgency escalations.',
        overall_health: 'stable',
        pain_points: [
          {
            title: 'Carrier delivery bottlenecks',
            category: 'delivery_logistics',
            severity: 'high',
            evidence: 'Volume of late shipment complaints spiked by 28%',
            root_cause_hypothesis: 'Third-party regional sorting facility disruptions.',
          },
        ],
        trends: ['Increase in weekend chat inquiries', 'Higher adoption of self-service returns'],
        recommendations: [
          {
            action: 'Implement proactive tracking delay email notifications',
            owner_suggestion: 'Logistics Operations Lead',
            effort: 'medium',
            expected_outcome: 'Estimated 35% reduction in Where-Is-My-Order tickets',
          },
        ],
        kb_gaps: ['Add specific guidance for international customs clearance timelines'],
      };
    default:
      return {};
  }
}
