import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getParamId } from '../utils/params';
import { sendPushNotification } from '../services/push.service';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markClicked,
} from '../services/notifications.service';

export function getVapidPublicKey(_req: Request, res: Response): void {
  res.json({ success: true, data: process.env.VAPID_PUBLIC_KEY || '' });
}

export async function subscribe(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { endpoint, p256dh, auth } = req.body;

  if (!endpoint || !p256dh || !auth) {
    res.status(400).json({ success: false, error: 'Invalid subscription object' });
    return;
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId, p256dh, auth },
  });

  await sendPushNotification(
    { endpoint, p256dh, auth },
    { title: '🎯 Mundane', body: 'Notifications are enabled!' },
    userId
  );

  res.json({ success: true });
}

export async function unsubscribe(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { endpoint } = req.body;

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
  res.json({ success: true });
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export async function getUnreadCountEndpoint(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;

  const count = await getUnreadCount(userId);
  res.json({ success: true, data: { count } });
}

export async function getReminders(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { limit, cursor, from, to, unreadOnly } = req.query;

  const result = await getNotifications(userId, {
    limit: limit ? parseInt(limit as string, 10) : 50,
    cursor: cursor as string | undefined,
    from: from as string | undefined,
    to: to as string | undefined,
    unreadOnly: unreadOnly === 'true',
  });

  const unreadCount = await getUnreadCount(userId);

  res.json({
    success: true,
    data: {
      notifications: result.data,
      meta: { ...result.meta, unreadCount },
    },
  });
}

export async function getReminder(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    res.status(404).json({ success: false, error: 'Notification not found' });
    return;
  }

  res.json({ success: true, data: notification });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);

  await markAsRead(userId, id);
  res.json({ success: true });
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;

  await markAllAsRead(userId);
  res.json({ success: true });
}

export async function clickReminder(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const id = getParamId(req.params);

  await markClicked(userId, id);
  await markAsRead(userId, id);
  res.json({ success: true });
}
