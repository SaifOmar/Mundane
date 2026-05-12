import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { importTasks } from '../controllers/import.controller';

export const importRouter = Router();
importRouter.use(requireAuth);
importRouter.post('/', importTasks);
