import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

const sendHealth = (req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'cx-copilot-backend',
  });
};

router.get('/', sendHealth);
router.get('/health', sendHealth);

export default router;
