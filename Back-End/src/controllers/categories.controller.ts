import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getParamId } from '../utils/params';

// Default categories seeded on first user request
const DEFAULT_CATEGORIES: Array<{ name: string; color: string; icon: string }> = [
  { name: 'Health', color: '#22c55e', icon: '🏃' },
  { name: 'Work', color: '#3b82f6', icon: '💼' },
  { name: 'Learning', color: '#a855f7', icon: '📚' },
  { name: 'Mindfulness', color: '#f59e0b', icon: '🧘' },
  { name: 'Social', color: '#ec4899', icon: '👥' },
  { name: 'Finance', color: '#10b981', icon: '💰' },
  { name: 'Home', color: '#f97316', icon: '🏠' },
  { name: 'Creative', color: '#8b5cf6', icon: '🎨' },
];

export async function getCategories(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;

  // Ensure defaults exist (idempotent)
  const existingDefaults = await prisma.category.findMany({ where: { userId: null } });
  if (existingDefaults.length === 0) {
    for (const c of DEFAULT_CATEGORIES) {
      await prisma.category.create({
        data: {
          name: c.name,
          color: c.color,
          icon: c.icon,
          isDefault: true,
          userId: null,
        },
      });
    }
  }

  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });

  res.json({ success: true, data: categories });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { name, color, icon } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ success: false, error: 'Name is required' });
    return;
  }

  const category = await prisma.category.create({
    data: { userId, name: name.trim(), color: color || '#6b7280', icon: icon || '📌' },
  });

  res.status(201).json({ success: true, data: category });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);

  const existing = await prisma.category.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Category not found or cannot delete defaults' });
    return;
  }

  await prisma.category.delete({ where: { id } });
  res.json({ success: true });
}
