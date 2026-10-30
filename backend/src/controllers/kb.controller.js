import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { KbService } from '../services/kb.service.js';

export const listKbArticles = asyncHandler(async (req, res) => {
  const articles = await KbService.listArticles(req.query);
  return sendSuccess(res, articles);
});

export const getKbArticle = asyncHandler(async (req, res) => {
  const article = await KbService.getArticleById(req.params.id);
  return sendSuccess(res, article);
});

export const createKbArticle = asyncHandler(async (req, res) => {
  const created = await KbService.createArticle(req.body, req.user);
  return sendSuccess(res, created, 201);
});

export const updateKbArticle = asyncHandler(async (req, res) => {
  const updated = await KbService.updateArticle(req.params.id, req.body, req.user);
  return sendSuccess(res, updated);
});

export const deleteKbArticle = asyncHandler(async (req, res) => {
  const result = await KbService.deleteArticle(req.params.id, req.user);
  return sendSuccess(res, result);
});
