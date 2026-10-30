import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { InsightService } from '../services/insight.service.js';

export const generateReport = asyncHandler(async (req, res) => {
  const report = await InsightService.generateReport(req.body, req.user);
  return sendSuccess(res, report, 201);
});

export const listReports = asyncHandler(async (req, res) => {
  const reports = await InsightService.listReports();
  return sendSuccess(res, reports);
});

export const getReportById = asyncHandler(async (req, res) => {
  const report = await InsightService.getReportById(req.params.id);
  return sendSuccess(res, report);
});
