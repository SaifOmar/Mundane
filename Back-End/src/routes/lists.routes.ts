import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getLists, createList, updateList, deleteList } from '../controllers/lists.controller';

export const listsRouter = Router();
listsRouter.use(requireAuth);

listsRouter.get('/', getLists);
listsRouter.post('/', createList);
listsRouter.patch('/:id', updateList);
listsRouter.delete('/:id', deleteList);
