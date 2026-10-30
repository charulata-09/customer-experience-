import { maskPii } from '../sanitize.js';

export const buildChatPrompt = ({
  domain,
  latestMessage,
  history = [],
  kbArticles = [],
}) => {
  const sanitizedLatest = maskPii(latestMessage);

  const historyText = history
    .slice(-10)
    .map((m) => `[${m.role}]: ${maskPii(m.content)}`)
    .join('\n');

  const kbText = kbArticles
    .map((kb) => `Title: ${kb.title}\n${kb.content}`)
    .join('\n\n');

  return `TASK: Continue this support chat as CX Copilot. Be brief (≤ 90 words), warm, and helpful.
domain: ${domain}
<knowledge_base>
${kbText || 'No specific KB articles found for this topic.'}
</knowledge_base>
<conversation>
${historyText || 'Session just started.'}
</conversation>
<customer_message>
${sanitizedLatest}
</customer_message>

RULES:
- Answer only from the knowledge base. If unsure, say so and offer to create a ticket.
- Detect frustration (anger, repeated failure, "manager", "cancel"). If detected, set escalate_suggested=true.
- Ask at most ONE clarifying question when needed.
Return JSON only.`;
};
