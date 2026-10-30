import { z } from 'zod';

export const analyticsDateRangeSchema = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .strict();

export const insightRequestSchema = z
  .object({
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD required'),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD required'),
  })
  .strict()
  .refine((data) => new Date(data.period_end) >= new Date(data.period_start), {
    message: 'period_end must be greater than or equal to period_start',
    path: ['period_end'],
  });

export const insightIdParamSchema = z
  .object({
    id: z.string().uuid('Invalid insight report ID'),
  })
  .strict();

export const customerIdParamSchema = z
  .object({
    id: z.string().uuid('Invalid customer ID'),
  })
  .strict();

export const brandSettingsSchema = z
  .object({
    brand_name: z.string().trim().min(2).max(100),
    brand_voice_guidelines: z.string().trim().min(5).max(1000),
    forbidden_phrases: z.array(z.string().trim()).default([]),
    signature: z.string().trim().min(2).max(200),
    default_tone: z.enum(['empathetic', 'professional', 'friendly', 'concise']).default('empathetic'),
  })
  .strict();
