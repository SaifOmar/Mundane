import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasks.controller';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get('/', getTasks);
tasksRouter.post('/', createTask);
tasksRouter.patch('/:id', updateTask);
tasksRouter.delete('/:id', deleteTask);
