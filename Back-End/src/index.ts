import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import { recurringRouter } from './routes/recurring.routes';
import { todayRouter } from './routes/today.routes';
import { tasksRouter } from './routes/tasks.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { categoriesRouter } from './routes/categories.routes';
import { listsRouter } from './routes/lists.routes';
import { importRouter } from './routes/import.routes';
import { startScheduler } from './services/scheduler.service';
import { prisma } from './db';

const app = express();
const PORT = process.env.PORT || 11111;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => callback(null, origin || true),
  credentials: true,
}));
app.use(morgan('dev'));

// Better Auth — handles /api/auth/* routes
app.use('/api/auth', toNodeHandler(auth));

// Body parsing for all other routes
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/today', todayRouter);
app.use('/api/recurring', recurringRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/lists', listsRouter);
app.use('/api/tasks/import', importRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
  await prisma.$connect();
  console.log('✅ Database connected');

  startScheduler();
  console.log('✅ Scheduler started');

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
