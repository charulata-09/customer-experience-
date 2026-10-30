import { Type } from '@google/genai';
import { HEALTH_TRENDS, URGENCIES, EFFORT_LEVELS } from '../../constants/enums.js';

export const generateInsightReportResponseSchema = {
  type: Type.OBJECT,
  properties: {
    executive_summary: {
      type: Type.STRING,
    },
    overall_health: {
      type: Type.STRING,
      enum: HEALTH_TRENDS,
    },
    pain_points: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            enum: URGENCIES,
          },
          evidence: { type: Type.STRING },
          root_cause_hypothesis: { type: Type.STRING },
        },
        required: ['title', 'category', 'severity', 'evidence', 'root_cause_hypothesis'],
      },
    },
    trends: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          owner_suggestion: { type: Type.STRING },
          effort: {
            type: Type.STRING,
            enum: EFFORT_LEVELS,
          },
          expected_outcome: { type: Type.STRING },
        },
        required: ['action', 'owner_suggestion', 'effort', 'expected_outcome'],
      },
    },
    kb_gaps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'executive_summary',
    'overall_health',
    'pain_points',
    'trends',
    'recommendations',
    'kb_gaps',
  ],
};
