import { prisma } from '../db';

interface CreateNotificationInput {
  userId: string;
  title: string;
  body?: string;
  icon?: string;
  url?: string;
  source?: 'push' | 'system' | 'manual';
  deliveredAt?: Date;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      icon: input.icon,
      url: input.url,
      source: input.source || 'push',
      deliveredAt: input.deliveredAt || null,
    },
  });
}

export async function getNotifications(
  userId: string,
  options: { limit?: number; cursor?: string; from?: string; to?: string; unreadOnly?: boolean }
) {
  const limit = Math.min(options.limit || 50, 100);
  const where: any = { userId };

  if (options.cursor) {
    where.id = { lt: options.cursor };
  }
  if (options.from) {
    where.sentAt = { ...(where.sentAt || {}), gte: new Date(options.from) };
  }
  if (options.to) {
    where.sentAt = { ...(where.sentAt || {}), lte: new Date(options.to) };
  }
  if (options.unreadOnly) {
    where.read = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { sentAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = notifications.length > limit;
  const data = hasMore ? notifications.slice(0, limit) : notifications;

  return {
    data,
    meta: {
      nextCursor: hasMore ? data[data.length - 1].id : null,
      total: await prisma.notification.count({ where: { userId } }),
    },
  };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAsRead(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function markClicked(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { clickedAt: new Date() },
  });
}
