import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getRecurringTasks,
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
  reorderRecurringTasks,
  batchArchiveRecurringTasks,
  batchDeleteRecurringTasks,
  duplicateRecurringTask,
} from '../controllers/recurring.controller';

export const recurringRouter = Router();
recurringRouter.use(requireAuth);

recurringRouter.get('/', getRecurringTasks);
recurringRouter.post('/', createRecurringTask);
recurringRouter.patch('/reorder', reorderRecurringTasks);
recurringRouter.patch('/batch/archive', batchArchiveRecurringTasks);
recurringRouter.delete('/batch', batchDeleteRecurringTasks);
recurringRouter.post('/:id/duplicate', duplicateRecurringTask);
recurringRouter.patch('/:id', updateRecurringTask);
recurringRouter.delete('/:id', deleteRecurringTask);
