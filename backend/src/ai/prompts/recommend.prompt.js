export const buildRecommendPrompt = ({
  firstName = 'Customer',
  memberSince = '',
  totalTickets = 0,
  avgSentiment = 0,
  csatAvg = 'N/A',
  openTickets = 0,
  ticketHistory = [],
}) => {
  const historyText = ticketHistory
    .slice(0, 10)
    .map(
      (t) =>
        `- [Subject: ${t.subject}] Category: ${t.category || 'general'}, Urgency: ${
          t.urgency || 'medium'
        }, Sentiment: ${t.sentiment || 'neutral'}, Status: ${t.status}`
    )
    .join('\n');

  return `TASK: Given the customer's interaction history, recommend the next-best engagement actions.
<customer_summary>
first_name: ${firstName} | member_since: ${memberSince} | total_tickets: ${totalTickets} | avg_sentiment: ${avgSentiment} | csat_avg: ${csatAvg} | open_tickets: ${openTickets}
</customer_summary>
<history>
${historyText || 'No prior tickets recorded.'}
</history>

RULES:
- health_score: 0–100 (100 = very healthy relationship).
- Provide 3 to 5 prioritized actions, each with a channel, timing, and expected impact.
- Never recommend discounts/credits as certain; mark them "needs approval".
Return JSON only.`;
};
