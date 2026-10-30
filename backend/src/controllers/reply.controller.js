import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ReplyService } from '../services/reply.service.js';

export const generateReply = asyncHandler(async (req, res) => {
  const result = await ReplyService.generateReply(req.params.id, req.body, req.user);
  return sendSuccess(res, result, 201);
});

export const editDraft = asyncHandler(async (req, res) => {
  const updated = await ReplyService.editDraft(req.params.draftId, req.body.draft_text, req.user);
  return sendSuccess(res, updated);
});

export const approveDraft = asyncHandler(async (req, res) => {
  const result = await ReplyService.approveDraft(
    req.params.draftId,
    req.body.status_after,
    req.user
  );
  return sendSuccess(res, result);
});
