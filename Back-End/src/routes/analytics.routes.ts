import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getAnalytics } from '../controllers/analytics.controller';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get('/', getAnalytics);
