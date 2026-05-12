import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  subscribe,
  unsubscribe,
  getVapidPublicKey,
} from '../controllers/notifications.controller';

export const notificationsRouter = Router();

// Public: frontend needs the VAPID key before auth to set up SW
notificationsRouter.get('/vapid-public-key', getVapidPublicKey);

notificationsRouter.use(requireAuth);
notificationsRouter.post('/subscribe', subscribe);
notificationsRouter.delete('/unsubscribe', unsubscribe);
