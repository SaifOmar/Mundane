import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

function getRangeStart(range: string): string {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start.toISOString().split('T')[0];
}

function dateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const current = new Date(startStr);
  const end = new Date(endStr);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const range = (req.query.range as string) || '30d';
  const startDate = getRangeStart(range);
  const endDate = new Date().toISOString().split('T')[0];

  // Fetch all completions in range
  const completions = await prisma.taskCompletion.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } },
    include: { recurringTask: true },
  });

  // Fetch all active recurring tasks
  const tasks = await prisma.recurringTask.findMany({
    where: { userId, archived: false },
  });

  // ─── Heatmap ─────────────────────────────────────────────────────────
  const allDates = dateRange(startDate, endDate);
  const completionsByDate = new Map<string, { completed: number; total: number }>();

  for (const date of allDates) {
    completionsByDate.set(date, { completed: 0, total: 0 });
  }
  for (const c of completions) {
    const entry = completionsByDate.get(c.date);
    if (!entry) continue;
    entry.total += 1;
    if (c.completedCount > 0 && !c.skipped) entry.completed += 1;
  }

  const heatmap = allDates.map(date => {
    const entry = completionsByDate.get(date)!;
    return {
      date,
      completionRate: entry.total > 0 ? entry.completed / entry.total : 0,
      completed: entry.completed,
      total: entry.total,
    };
  });

  // ─── Per-task analytics ──────────────────────────────────────────────
  const perTask = tasks.map(task => {
    const taskCompletions = completions.filter(c => c.recurringTaskId === task.id);
    const completedDays = taskCompletions.filter(c => c.completedCount > 0 && !c.skipped).length;
    const skippedDays = taskCompletions.filter(c => c.skipped).length;
    const missedDays = taskCompletions.filter(c => c.completedCount === 0 && !c.skipped).length;
    const totalDays = taskCompletions.length;

    // Streak calculation
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...allDates].reverse();
    let streakBroken = false;

    for (const date of sortedDates) {
      const c = taskCompletions.find(tc => tc.date === date);
      const done = c && c.completedCount > 0 && !c.skipped;
      if (done) {
        tempStreak++;
        if (!streakBroken) currentStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        streakBroken = true;
        tempStreak = 0;
      }
    }

    return {
      taskId: task.id,
      taskTitle: task.title,
      taskIcon: task.icon,
      completedDays,
      skippedDays,
      missedDays,
      totalDays,
      completionRate: totalDays > 0 ? completedDays / totalDays : 0,
      currentStreak,
      longestStreak,
    };
  });

  // ─── Daily trend ────────────────────────────────────────────────────
  const dailyTrend = allDates.map(date => {
    const dayCompletions = completions.filter(c => c.date === date);
    const completed = dayCompletions.filter(c => c.completedCount > 0 && !c.skipped).length;
    const total = dayCompletions.length;
    return {
      date,
      completionRate: total > 0 ? completed / total : 0,
      completed,
      total,
    };
  });

  // ─── Time distribution ──────────────────────────────────────────────
  const hourCounts = new Array(24).fill(0);
  for (const c of completions) {
    if (c.completedAt) {
      const hour = new Date(c.completedAt).getHours();
      hourCounts[hour]++;
    }
  }
  const timeDistribution = hourCounts.map((count, hour) => ({ hour, count }));

  // ─── Skip analysis ──────────────────────────────────────────────────
  const skipAnalysis = tasks.map(task => {
    const tc = completions.filter(c => c.recurringTaskId === task.id);
    return {
      taskId: task.id,
      taskTitle: task.title,
      taskIcon: task.icon,
      completed: tc.filter(c => c.completedCount > 0 && !c.skipped).length,
      skipped: tc.filter(c => c.skipped).length,
      missed: tc.filter(c => c.completedCount === 0 && !c.skipped).length,
    };
  });

  res.json({
    success: true,
    data: { heatmap, perTask, dailyTrend, timeDistribution, skipAnalysis },
  });
}
