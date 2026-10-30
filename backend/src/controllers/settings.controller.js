import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

export const getBrandSettings = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('brand_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    // Return default settings
    return sendSuccess(res, {
      id: 1,
      brand_name: 'Acme',
      brand_voice_guidelines: 'Warm, clear, respectful, solution-focused.',
      forbidden_phrases: [],
      signature: 'The Acme Support Team',
      default_tone: 'empathetic',
    });
  }

  return sendSuccess(res, data);
});

export const updateBrandSettings = asyncHandler(async (req, res) => {
  const { brand_name, brand_voice_guidelines, forbidden_phrases, signature, default_tone } =
    req.body;

  const { data, error } = await supabaseAdmin
    .from('brand_settings')
    .upsert(
      {
        id: 1,
        brand_name,
        brand_voice_guidelines,
        forbidden_phrases: forbidden_phrases || [],
        signature,
        default_tone,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    throw new AppError('UPDATE_SETTINGS_FAILED', error.message, 400);
  }

  return sendSuccess(res, data);
});
