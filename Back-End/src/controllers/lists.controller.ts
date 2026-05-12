import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getParamId } from '../utils/params';

export async function getLists(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const lists = await prisma.taskList.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: lists });
}

export async function createList(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { name, icon } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ success: false, error: 'Name is required' });
    return;
  }

  const last = await prisma.taskList.findFirst({ where: { userId }, orderBy: { sortOrder: 'desc' } });
  const list = await prisma.taskList.create({
    data: { userId, name: name.trim(), icon: icon || '📋', sortOrder: (last?.sortOrder ?? -1) + 1 },
  });

  res.status(201).json({ success: true, data: list });
}

export async function updateList(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);
  const { name, icon } = req.body as { name?: string; icon?: string };

  const existing = await prisma.taskList.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'List not found' });
    return;
  }

  const list = await prisma.taskList.update({ where: { id }, data: { ...(name && { name }), ...(icon && { icon }) } });
  res.json({ success: true, data: list });
}

export async function deleteList(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);

  const existing = await prisma.taskList.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'List not found' });
    return;
  }

  // Unlink recurring tasks from this list (don't delete them)
  await prisma.recurringTask.updateMany({ where: { listId: id, userId }, data: { listId: null } });
  await prisma.taskList.delete({ where: { id } });
  res.json({ success: true });
}
