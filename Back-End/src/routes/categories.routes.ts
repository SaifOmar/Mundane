import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getCategories, createCategory, deleteCategory } from '../controllers/categories.controller';

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

categoriesRouter.get('/', getCategories);
categoriesRouter.post('/', createCategory);
categoriesRouter.delete('/:id', deleteCategory);
