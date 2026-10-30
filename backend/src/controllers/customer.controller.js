import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { CustomerService } from '../services/customer.service.js';

export const getCustomerProfile = asyncHandler(async (req, res) => {
  const profile = await CustomerService.getCustomerProfile(req.params.id);
  return sendSuccess(res, profile);
});

export const generateRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await CustomerService.generateRecommendations(
    req.params.id,
    req.user
  );
  return sendSuccess(res, recommendations, 201);
});

export const getLatestRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await CustomerService.getLatestRecommendations(req.params.id);
  return sendSuccess(res, recommendations);
});
