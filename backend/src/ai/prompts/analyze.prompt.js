import { maskPii } from '../sanitize.js';

export const buildAnalyzePrompt = ({
  domain,
  channel,
  subject,
  reference_id,
  message,
  history = {},
}) => {
  const sanitizedMessage = maskPii(message);
  const count = history.previous_tickets_count || 0;
  const recentSentiments = (history.recent_sentiments || []).join(', ') || 'none';
  const unresolved = history.unresolved_tickets || 0;

  return `TASK: Analyze the customer ticket below.

<ticket>
domain: ${domain}
channel: ${channel}
subject: ${subject}
reference_id: ${reference_id || 'none'}
</ticket>
<customer_message>
${sanitizedMessage}
</customer_message>
<customer_history>
previous_tickets_count: ${count}
recent_sentiments: ${recentSentiments}
unresolved_tickets: ${unresolved}
</customer_history>

RULES:
- category must be one of: billing_payment, delivery_logistics, product_quality, technical_issue, account_access, refund_return, service_quality, feature_request, general_inquiry, compliment
- intent must be one of: complaint, question, request, cancellation_threat, feedback, praise, escalation_demand
- urgency per rubric: critical (financial loss, security/privacy, legal threat, outage, churn threat + high anger), high, medium, low
- sentiment_score: -1.0 (extremely negative) to 1.0 (extremely positive)
- churn_risk: 0–100; raise it for repeated issues, cancellation language, high anger, or unresolved history
- summary: one neutral sentence, ≤ 25 words
- escalate=true for critical urgency, legal/security/fraud, or explicit demand for a manager
Return JSON only.`;
};
