import { Type } from '@google/genai';
import { RISK_LEVELS } from '../../constants/enums.js';

export const recommendActionsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    health_score: {
      type: Type.INTEGER,
    },
    risk_level: {
      type: Type.STRING,
      enum: RISK_LEVELS,
    },
    headline: {
      type: Type.STRING,
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.INTEGER },
          action: { type: Type.STRING },
          channel: {
            type: Type.STRING,
            enum: ['email', 'phone', 'in_app', 'social'],
          },
          timing: { type: Type.STRING },
          expected_impact: { type: Type.STRING },
          needs_approval: { type: Type.BOOLEAN },
        },
        required: [
          'priority',
          'action',
          'channel',
          'timing',
          'expected_impact',
          'needs_approval',
        ],
      },
    },
  },
  required: ['health_score', 'risk_level', 'headline', 'recommendations'],
};
