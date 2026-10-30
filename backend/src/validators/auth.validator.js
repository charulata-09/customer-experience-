import { z } from 'zod';
import { USER_ROLES } from '../constants/enums.js';

export const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(100).optional(),
    avatar_url: z.string().trim().url().nullable().optional(),
  })
  .strict();

export const updateRoleSchema = z
  .object({
    role: z.enum(USER_ROLES),
  })
  .strict();

export const userIdParamSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();
