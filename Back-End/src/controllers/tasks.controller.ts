import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getParamId } from '../utils/params';

export async function getTasks(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { status, priority, categoryId } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      ...(status ? { status: status as string } : {}),
      ...(priority ? { priority: priority as string } : {}),
      ...(categoryId ? { categoryId: categoryId as string } : {}),
    },
    include: { category: true },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  res.json({ success: true, data: tasks });
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { title, description, categoryId, dueDate, priority } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ success: false, error: 'Title is required' });
    return;
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: title.trim(),
      description: description || null,
      categoryId: categoryId || null,
      dueDate: dueDate || null,
      priority: priority || 'MEDIUM',
    },
    include: { category: true },
  });

  res.status(201).json({ success: true, data: task });
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);
  const updates = req.body as {
    title?: string;
    description?: string;
    categoryId?: string | null;
    dueDate?: string | null;
    priority?: string;
    status?: string;
  };

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...updates,
      ...(updates.status === 'DONE' && !existing.completedAt
        ? { completedAt: new Date().toISOString() }
        : {}),
    },
    include: { category: true },
  });

  res.json({ success: true, data: task });
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  await prisma.task.delete({ where: { id } });
  res.json({ success: true });
}

export async function batchCompleteTasks(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { ids } = req.body as { ids: string[] };

  if (!ids?.length) {
    res.status(400).json({ success: false, error: 'No task IDs provided' });
    return;
  }

  await prisma.task.updateMany({
    where: { id: { in: ids }, userId },
    data: { status: 'DONE', completedAt: new Date().toISOString() },
  });

  res.json({ success: true });
}

export async function batchDeleteTasks(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { ids } = req.body as { ids: string[] };

  if (!ids?.length) {
    res.status(400).json({ success: false, error: 'No task IDs provided' });
    return;
  }

  await prisma.task.deleteMany({
    where: { id: { in: ids }, userId },
  });

  res.json({ success: true });
}

export async function duplicateTask(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);

  const original = await prisma.task.findFirst({ where: { id, userId } });
  if (!original) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: original.title,
      description: original.description,
      categoryId: original.categoryId,
      priority: original.priority,
      status: 'TODO',
    },
    include: { category: true },
  });

  res.status(201).json({ success: true, data: task });
}
