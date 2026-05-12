import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  subscribe,
  unsubscribe,
  getVapidPublicKey,
  getReminders,
  getReminder,
  markRead,
  markAllRead,
  clickReminder,
  getUnreadCountEndpoint,
} from '../controllers/notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/vapid-public-key', getVapidPublicKey);

notificationsRouter.use(requireAuth);
notificationsRouter.post('/subscribe', subscribe);
notificationsRouter.delete('/unsubscribe', unsubscribe);

notificationsRouter.get('/reminders', getReminders);
notificationsRouter.patch('/reminders/read-all', markAllRead);
notificationsRouter.get('/reminders/unread-count', getUnreadCountEndpoint);
notificationsRouter.get('/reminders/:id', getReminder);
notificationsRouter.patch('/reminders/:id/read', markRead);
notificationsRouter.patch('/reminders/:id/click', clickReminder);
