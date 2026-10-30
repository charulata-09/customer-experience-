import { Type } from '@google/genai';
import {
  SENTIMENTS,
  INTENTS,
  CATEGORIES,
  URGENCIES,
  EMOTIONS,
} from '../../constants/enums.js';

export const analyzeTicketResponseSchema = {
  type: Type.OBJECT,
  properties: {
    sentiment: {
      type: Type.STRING,
      enum: SENTIMENTS,
    },
    sentiment_score: {
      type: Type.NUMBER,
    },
    intent: {
      type: Type.STRING,
      enum: INTENTS,
    },
    category: {
      type: Type.STRING,
      enum: CATEGORIES,
    },
    urgency: {
      type: Type.STRING,
      enum: URGENCIES,
    },
    churn_risk: {
      type: Type.INTEGER,
    },
    emotions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        enum: EMOTIONS,
      },
    },
    key_entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ['type', 'value'],
      },
    },
    summary: {
      type: Type.STRING,
    },
    escalate: {
      type: Type.BOOLEAN,
    },
    escalation_reason: {
      type: Type.STRING,
    },
  },
  required: [
    'sentiment',
    'sentiment_score',
    'intent',
    'category',
    'urgency',
    'churn_risk',
    'emotions',
    'key_entities',
    'summary',
    'escalate',
    'escalation_reason',
  ],
};
