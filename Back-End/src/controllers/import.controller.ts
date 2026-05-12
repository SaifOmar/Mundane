import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

async function resolveCategoryId(userId: string, name: string): Promise<string | null> {
  const cat = await prisma.category.findFirst({
    where: { name, OR: [{ userId }, { userId: null }] },
  });
  return cat?.id || null;
}

export async function importTasks(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { tasks = [], recurringTasks = [], categories = [] } = req.body;

  const result: Record<string, unknown> = {
    tasksCreated: 0,
    tasksErrors: [] as string[],
    recurringCreated: 0,
    recurringErrors: [] as string[],
    categoriesCreated: 0,
    categoriesErrors: [] as string[],
  };

  const tasksErrors: string[] = [];
  const recurringErrors: string[] = [];
  const categoriesErrors: string[] = [];

  for (const cat of categories) {
    if (!cat.name?.trim()) {
      categoriesErrors.push('Skipped category with missing name');
      continue;
    }
    try {
      await prisma.category.create({
        data: {
          userId,
          name: cat.name.trim(),
          color: cat.color || '#f59e0b',
          icon: cat.icon || '📁',
          isDefault: cat.isDefault ?? false,
        },
      });
      result.categoriesCreated = (result.categoriesCreated as number) + 1;
    } catch (e) {
      categoriesErrors.push(`"${cat.name}": ${(e as Error).message}`);
    }
  }

  for (const task of tasks) {
    if (!task.title?.trim()) {
      tasksErrors.push('Skipped task with missing title');
      continue;
    }
    try {
      let categoryId = task.categoryId || null;
      if (task.categoryName && !categoryId) {
        categoryId = await resolveCategoryId(userId, task.categoryName);
        if (!categoryId) tasksErrors.push(`"${task.title}": Category "${task.categoryName}" not found`);
      }

      await prisma.task.create({
        data: {
          userId,
          title: task.title.trim(),
          description: task.description || null,
          categoryId,
          dueDate: task.dueDate || null,
          priority: task.priority || 'MEDIUM',
          status: task.status || 'TODO',
          completedAt: task.completedAt || null,
        },
      });
      result.tasksCreated = (result.tasksCreated as number) + 1;
    } catch (e) {
      tasksErrors.push(`"${task.title}": ${(e as Error).message}`);
    }
  }

  for (const task of recurringTasks) {
    if (!task.title?.trim()) {
      recurringErrors.push('Skipped recurring task with missing title');
      continue;
    }
    try {
      let categoryId = task.categoryId || null;
      if (task.categoryName && !categoryId) {
        categoryId = await resolveCategoryId(userId, task.categoryName);
        if (!categoryId) recurringErrors.push(`"${task.title}": Category "${task.categoryName}" not found`);
      }

      const lastTask = await prisma.recurringTask.findFirst({
        where: { userId },
        orderBy: { sortOrder: 'desc' },
      });

      await prisma.recurringTask.create({
        data: {
          userId,
          title: task.title.trim(),
          icon: task.icon || '✅',
          listId: task.listId || null,
          categoryId,
          frequency: task.frequency || 'DAILY',
          daysOfWeek: JSON.stringify(task.daysOfWeek || []),
          timesPerDay: task.timesPerDay || 1,
          timeOfDay: task.timeOfDay || null,
          reminderEnabled: task.reminderEnabled ?? false,
          reminderMinutesBefore: task.reminderMinutesBefore ?? 15,
          archived: task.archived ?? false,
          sortOrder: (lastTask?.sortOrder ?? -1) + 1,
        },
      });
      result.recurringCreated = (result.recurringCreated as number) + 1;
    } catch (e) {
      recurringErrors.push(`"${task.title}": ${(e as Error).message}`);
    }
  }

  result.tasksErrors = tasksErrors;
  result.recurringErrors = recurringErrors;
  result.categoriesErrors = categoriesErrors;

  res.json({ success: true, data: result });
}
