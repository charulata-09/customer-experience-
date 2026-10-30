import { maskPii } from '../sanitize.js';

export const buildInsightPrompt = ({
  periodStart,
  periodEnd,
  metrics = {},
  sampleNegativeSummaries = [],
}) => {
  const anonymizedSummaries = sampleNegativeSummaries
    .map((s, idx) => `${idx + 1}. [Category: ${s.category}] Summary: ${maskPii(s.summary)}`)
    .join('\n');

  return `TASK: Produce an executive CX insight report for ${periodStart} to ${periodEnd}.
<metrics>
${JSON.stringify(metrics, null, 2)}
</metrics>
<sample_issues>
${anonymizedSummaries || 'No high severity negative issues in this period.'}
</sample_issues>

RULES:
- Base every claim on the metrics provided; cite the metric in "evidence".
- Identify the top 3–5 pain points, rank by business impact (volume × severity × churn risk).
- Offer root-cause hypotheses, clearly labeled as hypotheses.
- Recommendations must be specific, owner-assignable, and include an effort level.
Return JSON only.`;
};
