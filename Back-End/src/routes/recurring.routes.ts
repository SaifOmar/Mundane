import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getRecurringTasks,
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
  reorderRecurringTasks,
} from '../controllers/recurring.controller';

export const recurringRouter = Router();
recurringRouter.use(requireAuth);

recurringRouter.get('/', getRecurringTasks);
recurringRouter.post('/', createRecurringTask);
recurringRouter.patch('/reorder', reorderRecurringTasks);
recurringRouter.patch('/:id', updateRecurringTask);
recurringRouter.delete('/:id', deleteRecurringTask);
