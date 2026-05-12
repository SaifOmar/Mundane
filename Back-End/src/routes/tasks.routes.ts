import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  batchCompleteTasks,
  batchDeleteTasks,
  duplicateTask,
} from '../controllers/tasks.controller';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get('/', getTasks);
tasksRouter.post('/', createTask);
tasksRouter.patch('/batch/complete', batchCompleteTasks);
tasksRouter.delete('/batch', batchDeleteTasks);
tasksRouter.post('/:id/duplicate', duplicateTask);
tasksRouter.patch('/:id', updateTask);
tasksRouter.delete('/:id', deleteTask);
