import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getToday, toggleCompletion } from '../controllers/today.controller';

export const todayRouter = Router();
todayRouter.use(requireAuth);

todayRouter.get('/', getToday);
todayRouter.patch('/completions/:id', toggleCompletion);
