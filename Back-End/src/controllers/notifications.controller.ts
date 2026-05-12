import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendPushNotification } from '../services/push.service';

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

  // Send a welcome notification
  await sendPushNotification(
    { endpoint, p256dh, auth },
    { title: '🎯 ProjectTasks', body: 'Notifications are enabled!' }
  );

  res.json({ success: true });
}

export async function unsubscribe(req: Request, res: Response): Promise<void> {
  const { userId } = req as AuthRequest;
  const { endpoint } = req.body;

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
  res.json({ success: true });
}
