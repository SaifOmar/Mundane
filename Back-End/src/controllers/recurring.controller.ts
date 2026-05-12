import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getParamId } from '../utils/params';

export async function getRecurringTasks(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { archived, listId } = req.query;

  const tasks = await prisma.recurringTask.findMany({
    where: {
      userId,
      archived: archived === 'true' ? true : false,
      ...(listId ? { listId: listId as string } : {}),
    },
    include: { category: true, list: true },
    orderBy: [{ listId: 'asc' }, { sortOrder: 'asc' }],
  });

  res.json({
    success: true,
    data: tasks.map(t => ({ ...t, daysOfWeek: JSON.parse(t.daysOfWeek || '[]') })),
  });
}

export async function createRecurringTask(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const {
    title, icon, listId, categoryId,
    frequency, daysOfWeek, timesPerDay,
    timeOfDay, reminderEnabled, reminderMinutesBefore,
  } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ success: false, error: 'Title is required' });
    return;
  }

  // Get next sort order
  const lastTask = await prisma.recurringTask.findFirst({
    where: { userId, listId: listId || null },
    orderBy: { sortOrder: 'desc' },
  });

  const task = await prisma.recurringTask.create({
    data: {
      userId,
      title: title.trim(),
      icon: icon || '✅',
      listId: listId || null,
      categoryId: categoryId || null,
      frequency: frequency || 'DAILY',
      daysOfWeek: JSON.stringify(daysOfWeek || []),
      timesPerDay: timesPerDay || 1,
      timeOfDay: timeOfDay || null,
      reminderEnabled: reminderEnabled || false,
      reminderMinutesBefore: reminderMinutesBefore || 15,
      sortOrder: (lastTask?.sortOrder ?? -1) + 1,
    },
    include: { category: true, list: true },
  });

  res.status(201).json({
    success: true,
    data: { ...task, daysOfWeek: JSON.parse(task.daysOfWeek) },
  });
}

export async function updateRecurringTask(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);
  const updates = req.body as {
    title?: string;
    icon?: string;
    frequency?: string;
    daysOfWeek?: number[];
    timesPerDay?: number;
    timeOfDay?: string | null;
    reminderEnabled?: boolean;
    reminderMinutesBefore?: number;
  };

  const existing = await prisma.recurringTask.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  const { daysOfWeek, ...rest } = updates;
  const task = await prisma.recurringTask.update({
    where: { id },
    data: {
      ...rest,
      ...(daysOfWeek !== undefined ? { daysOfWeek: JSON.stringify(daysOfWeek) } : {}),
    },
    include: { category: true, list: true },
  });

  res.json({
    success: true,
    data: { ...task, daysOfWeek: JSON.parse(task.daysOfWeek) },
  });
}

export async function deleteRecurringTask(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);

  const existing = await prisma.recurringTask.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  await prisma.recurringTask.delete({ where: { id } });
  res.json({ success: true });
}

export async function reorderRecurringTasks(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { orderedIds } = req.body as { orderedIds: string[] };

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.recurringTask.updateMany({
        where: { id, userId },
        data: { sortOrder: index },
      })
    )
  );

  res.json({ success: true });
}
