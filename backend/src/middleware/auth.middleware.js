import { supabaseAdmin, createUserClient } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Authentication token is missing or malformed', 401);
  }

  const token = authHeader.split(' ')[1];

  // Verify the JWT via Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authData?.user) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired authentication session', 401);
  }

  const authUser = authData.user;

  // Fetch user profile from public.profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    // If profile row doesn't exist yet, fallback to default role
    req.user = {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || 'User',
      role: 'customer',
      avatar_url: authUser.user_metadata?.avatar_url || null,
    };
  } else {
    req.user = profile;
  }

  // Attach token and user-scoped Supabase client for RLS queries
  req.token = token;
  req.supabase = createUserClient(token);

  next();
});

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'FORBIDDEN',
          `Access restricted: requires one of [${allowedRoles.join(', ')}] role`,
          403
        )
      );
    }

    next();
  };
};
