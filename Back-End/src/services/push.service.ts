import webpush from 'web-push';
import { prisma } from '../db';
import { createNotification } from './notifications.service';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@localhost',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(
  sub: PushSub,
  payload: PushPayload,
  userId?: string
): Promise<void> {
  let notificationId: string | null = null;

  if (userId) {
    const notif = await createNotification({
      userId,
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      url: payload.url,
      source: 'push',
    });
    notificationId = notif.id;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );

    if (userId && notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { deliveredAt: new Date() },
      });
    }
  } catch (err: any) {
    console.warn(`Push failed for ${sub.endpoint.slice(0, 40)}...`, err?.statusCode);
    if (userId && notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { errorText: `Status: ${err?.statusCode || 'unknown'}` },
      });
    }
  }
}
