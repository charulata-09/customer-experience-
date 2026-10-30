import { z } from 'zod';
import { DOMAINS, CATEGORIES } from '../constants/enums.js';

export const createKbSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    domain: z.enum(DOMAINS),
    category: z.enum(CATEGORIES),
    content: z.string().trim().min(20, 'Content must be at least 20 characters').max(8000),
    is_published: z.boolean().default(true),
  })
  .strict();

export const updateKbSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    domain: z.enum(DOMAINS).optional(),
    category: z.enum(CATEGORIES).optional(),
    content: z.string().trim().min(20).max(8000).optional(),
    is_published: z.boolean().optional(),
  })
  .strict();

export const kbIdParamSchema = z
  .object({
    id: z.string().uuid('Invalid KB article ID'),
  })
  .strict();

export const listKbQuerySchema = z
  .object({
    domain: z.enum(DOMAINS).optional(),
    category: z.enum(CATEGORIES).optional(),
    q: z.string().trim().optional(),
  })
  .strict();
