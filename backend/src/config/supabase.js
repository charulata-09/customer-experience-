import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Service-role Supabase client (used ONLY for background tasks, admin actions, seed, and audit logging)
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// User-scoped Supabase client created per request to enforce Row Level Security (RLS)
export const createUserClient = (accessToken) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};
