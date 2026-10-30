import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { TicketService } from '../services/ticket.service.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await TicketService.createTicket(req.user, req.body);
  return sendSuccess(res, ticket, 201);
});

export const listTickets = asyncHandler(async (req, res) => {
  const result = await TicketService.listTickets(req.user, req.query);
  return sendSuccess(res, result);
});

export const getTicketById = asyncHandler(async (req, res) => {
  const data = await TicketService.getTicketById(req.user, req.params.id);
  return sendSuccess(res, data);
});

export const updateTicket = asyncHandler(async (req, res) => {
  const updated = await TicketService.updateTicket(req.params.id, req.body, req.user);
  return sendSuccess(res, updated);
});

export const addMessage = asyncHandler(async (req, res) => {
  const message = await TicketService.addMessage(req.params.id, req.user, req.body.body);
  return sendSuccess(res, message, 201);
});

export const submitCsat = asyncHandler(async (req, res) => {
  const csat = await TicketService.submitCsat(
    req.params.id,
    req.user,
    req.body.rating,
    req.body.comment
  );
  return sendSuccess(res, csat, 201);
});

export const reanalyzeTicket = asyncHandler(async (req, res) => {
  const analysis = await TicketService.reanalyzeTicket(req.params.id, req.user);
  return sendSuccess(res, analysis);
});
