import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getParamId } from '../utils/params';

function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

// Check if a recurring task should appear on a given date
function shouldAppearToday(task: {
  frequency: string;
  daysOfWeek: string;
}): boolean {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun, 6=Sat
  const freq = task.frequency;

  if (freq === 'DAILY') return true;
  if (freq === 'WEEKDAYS') return dow >= 1 && dow <= 5;
  if (freq === 'WEEKENDS') return dow === 0 || dow === 6;
  if (freq === 'CUSTOM') {
    const days: number[] = JSON.parse(task.daysOfWeek || '[]');
    return days.includes(dow);
  }
  return true;
}

export async function getToday(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const dateStr = getTodayDateStr();

  // Get all active recurring tasks for this user
  const recurringTasks = await prisma.recurringTask.findMany({
    where: { userId, archived: false },
    include: { category: true, list: true },
    orderBy: [{ listId: 'asc' }, { sortOrder: 'asc' }],
  });

  // Filter tasks that should appear today
  const todaysTasks = recurringTasks.filter(shouldAppearToday);

  // Ensure completion rows exist for today
  for (const task of todaysTasks) {
    await prisma.taskCompletion.upsert({
      where: { recurringTaskId_date: { recurringTaskId: task.id, date: dateStr } },
      create: { recurringTaskId: task.id, userId, date: dateStr },
      update: {},
    });
  }

  // Fetch completions for today
  const completions = await prisma.taskCompletion.findMany({
    where: { userId, date: dateStr, recurringTaskId: { in: todaysTasks.map(t => t.id) } },
  });

  const completionMap = new Map(completions.map(c => [c.recurringTaskId, c]));

  // Get due tasks for today (one-off)
  const dueTasks = await prisma.task.findMany({
    where: {
      userId,
      dueDate: dateStr,
      status: { not: 'DONE' },
    },
    include: { category: true },
    orderBy: { priority: 'desc' },
  });

  const tasksWithCompletions = todaysTasks.map(task => ({
    ...task,
    daysOfWeek: JSON.parse(task.daysOfWeek || '[]'),
    todayCompletion: completionMap.get(task.id)!,
  }));

  const completedCount = completions.filter(c => c.completedCount >= 1 && !c.skipped).length;
  const skippedCount = completions.filter(c => c.skipped).length;

  res.json({
    success: true,
    data: {
      date: dateStr,
      recurringTasks: tasksWithCompletions,
      dueTasks,
      stats: {
        totalRecurring: todaysTasks.length,
        completedRecurring: completedCount,
        skippedRecurring: skippedCount,
      },
    },
  });
}

export async function toggleCompletion(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);
  const { action } = req.body as { action: 'complete' | 'skip' | 'reset' | 'increment' };

  const completion = await prisma.taskCompletion.findFirst({
    where: { id, userId },
    include: { recurringTask: true },
  });

  if (!completion) {
    res.status(404).json({ success: false, error: 'Completion not found' });
    return;
  }

  const timesPerDay = completion.recurringTask.timesPerDay;
  let updatedCompletion;

  if (action === 'complete') {
    updatedCompletion = await prisma.taskCompletion.update({
      where: { id },
      data: {
        completedCount: timesPerDay,
        skipped: false,
        completedAt: new Date().toISOString() as any,
      },
    });
  } else if (action === 'increment') {
    const newCount = Math.min(completion.completedCount + 1, timesPerDay);
    updatedCompletion = await prisma.taskCompletion.update({
      where: { id },
      data: {
        completedCount: newCount,
        skipped: false,
        completedAt: new Date().toISOString() as any,
      },
    });
  } else if (action === 'skip') {
    updatedCompletion = await prisma.taskCompletion.update({
      where: { id },
      data: {
        skipped: true,
        completedCount: 0,
        completedAt: null,
      },
    });
  } else if (action === 'reset') {
    updatedCompletion = await prisma.taskCompletion.update({
      where: { id },
      data: {
        completedCount: 0,
        skipped: false,
        completedAt: null,
      },
    });
  } else {
    res.status(400).json({ success: false, error: 'Invalid action' });
    return;
  }

  res.json({ success: true, data: updatedCompletion });
}
