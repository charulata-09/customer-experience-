import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ChatService } from '../services/chat.service.js';

export const createSession = asyncHandler(async (req, res) => {
  const session = await ChatService.createSession(req.user.id, req.body.domain);
  return sendSuccess(res, session, 201);
});

export const getSession = asyncHandler(async (req, res) => {
  const data = await ChatService.getSession(req.params.id, req.user);
  return sendSuccess(res, data);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const result = await ChatService.sendMessage(req.params.id, req.user, req.body.content);
  return sendSuccess(res, result, 201);
});

export const escalateToTicket = asyncHandler(async (req, res) => {
  const ticket = await ChatService.escalateToTicket(req.params.id, req.user, req.body);
  return sendSuccess(res, ticket, 201);
});
