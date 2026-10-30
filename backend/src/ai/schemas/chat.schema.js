import { Type } from '@google/genai';
import { SENTIMENTS } from '../../constants/enums.js';

export const chatAssistantResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
    },
    escalate_suggested: {
      type: Type.BOOLEAN,
    },
    detected_sentiment: {
      type: Type.STRING,
      enum: SENTIMENTS,
    },
    quick_replies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['reply', 'escalate_suggested', 'detected_sentiment', 'quick_replies'],
};
