import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REMINDER_TEMPLATES = [
  { body: 'Time to get this done!', source: 'system' },
  { body: 'Don\'t forget your task', source: 'push' },
  { body: 'Stay on track!', source: 'push' },
  { body: 'Habit reminder', source: 'system' },
  { body: null as string | null, source: 'system' },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedReminders() {
  const user = await prisma.user.findUnique({
    where: { email: 'aliensaif722@gmail.com' },
  });

  if (!user) {
    console.error('User not found. Have you signed up yet?');
    process.exit(1);
  }

  // Clear existing notifications for clean seed
  await prisma.notification.deleteMany({ where: { userId: user.id } });

  const tasks = await prisma.recurringTask.findMany({
    where: { userId: user.id },
  });

  const notifications: any[] = [];

  for (let daysAgo = 14; daysAgo >= 0; daysAgo--) {
    const now = new Date();
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    // Each day gets notifications at various times
    const reminderTimes = [7, 9, 12, 15, 18, 20];

    for (const task of tasks) {
      if (Math.random() > 0.45) continue; // ~55% chance each day

      const time = pick(reminderTimes);
      const sentAt = new Date(date);
      sentAt.setHours(time, randomInt(0, 59), 0, 0);

      const template = pick(REMINDER_TEMPLATES);
      const delivered = Math.random() > 0.15; // 85% delivered

      notifications.push({
        userId: user.id,
        title: `${task.icon} ${task.title}`,
        body: template.body || `${task.title} reminder`,
        source: template.source,
        sentAt,
        deliveredAt: delivered ? sentAt : null,
        read: daysAgo > 2 ? true : Math.random() > 0.4, // older = read, newer = mixed
        errorText: delivered ? null : 'Status: 410',
      });
    }

    // Add some one-off task notifications
    if (Math.random() > 0.5) {
      const sentAt = new Date(date);
      sentAt.setHours(randomInt(8, 22), randomInt(0, 59), 0, 0);
      notifications.push({
        userId: user.id,
        title: `📝 Task due today`,
        body: 'You have an outstanding task',
        url: '/tasks',
        source: 'push',
        sentAt,
        deliveredAt: sentAt,
        read: daysAgo > 3,
      });
    }
  }

  // Create in batches of 50
  for (let i = 0; i < notifications.length; i += 50) {
    await prisma.notification.createMany({
      data: notifications.slice(i, i + 50),
    });
  }

  console.log(`✅ Seeded ${notifications.length} dummy reminders for ${user.email}`);
  await prisma.$disconnect();
}

seedReminders().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
