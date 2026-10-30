import { maskPii } from '../sanitize.js';

export const buildReplyPrompt = ({
  tone,
  language = 'English',
  maxWords = 160,
  includeCompensation = false,
  firstName = 'Customer',
  ticket = {},
  conversation = [],
  kbArticles = [],
}) => {
  const sanitizedMessage = maskPii(ticket.message || '');
  const emotionsText = Array.isArray(ticket.emotions) ? ticket.emotions.join(', ') : 'none';

  const threadText = conversation
    .map((m) => `[${m.sender_type}]: ${maskPii(m.body)}`)
    .join('\n');

  const kbText = kbArticles
    .map((kb) => `[ID: ${kb.id}] Title: ${kb.title}\n${kb.content}`)
    .join('\n\n');

  return `TASK: Draft a reply to the customer.
tone: ${tone}   language: ${language}   max_words: ${maxWords}
include_compensation_suggestion: ${includeCompensation}
customer_first_name: ${firstName}

<ticket>
subject: ${ticket.subject} | category: ${ticket.category || 'general'} | urgency: ${ticket.urgency || 'medium'} | sentiment: ${ticket.sentiment || 'neutral'} | emotions: ${emotionsText}
</ticket>
<customer_message>
${sanitizedMessage}
</customer_message>
<conversation>
${threadText || 'No prior replies.'}
</conversation>
<knowledge_base>
${kbText || 'No specific KB articles found.'}
</knowledge_base>

RULES:
- Open with a specific acknowledgment of the customer's situation (not a generic "sorry for the inconvenience").
- Provide concrete next steps grounded ONLY in the knowledge base. If the KB lacks the answer, say you are checking with the team and state what you need from the customer.
- Do not promise refunds/credits. If compensation is enabled, put it ONLY in suggested_actions as a "suggestion for agent approval".
- End with the brand signature.
- Stay within max_words. Return JSON only.`;
};
