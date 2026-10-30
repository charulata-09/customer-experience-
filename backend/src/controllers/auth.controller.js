import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import { supabaseAdmin } from '../config/supabase.js';

export const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, req.user);
});

export const updateMe = asyncHandler(async (req, res) => {
  const { full_name, avatar_url } = req.body;
  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;

  if (Object.keys(updates).length === 0) {
    return sendSuccess(res, req.user);
  }

  const { data, error } = await req.supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (error) {
    throw new AppError('UPDATE_PROFILE_FAILED', error.message, 400);
  }

  return sendSuccess(res, data);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('USER_NOT_FOUND', 'User profile not found or role update failed', 404);
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: req.user.id,
    action: 'UPDATE_ROLE',
    entity: 'profiles',
    entity_id: id,
    metadata: { new_role: role },
  });

  return sendSuccess(res, data);
});
