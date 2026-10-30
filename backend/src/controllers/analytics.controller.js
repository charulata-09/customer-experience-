import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { AnalyticsService } from '../services/analytics.service.js';

export const getOverview = asyncHandler(async (req, res) => {
  const kpis = await AnalyticsService.getOverviewKpis(req.query);
  return sendSuccess(res, kpis);
});

export const getSentimentTrend = asyncHandler(async (req, res) => {
  const trend = await AnalyticsService.getSentimentTrend();
  return sendSuccess(res, trend);
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await AnalyticsService.getCategoriesDistribution();
  return sendSuccess(res, categories);
});

export const getUrgency = asyncHandler(async (req, res) => {
  const urgency = await AnalyticsService.getUrgencyDistribution();
  return sendSuccess(res, urgency);
});

export const getChannels = asyncHandler(async (req, res) => {
  const channels = await AnalyticsService.getChannelsDistribution();
  return sendSuccess(res, channels);
});
