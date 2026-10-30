import { Type } from '@google/genai';
import { TONES } from '../../constants/enums.js';

export const generateReplyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply_text: {
      type: Type.STRING,
    },
    tone_used: {
      type: Type.STRING,
      enum: TONES,
    },
    kb_article_ids_used: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    suggested_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          reason: { type: Type.STRING },
          requires_approval: { type: Type.BOOLEAN },
        },
        required: ['action', 'reason', 'requires_approval'],
      },
    },
    confidence: {
      type: Type.NUMBER,
    },
    agent_notes: {
      type: Type.STRING,
    },
  },
  required: [
    'reply_text',
    'tone_used',
    'kb_article_ids_used',
    'suggested_actions',
    'confidence',
    'agent_notes',
  ],
};
