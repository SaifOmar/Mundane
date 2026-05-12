import cron from 'node-cron';
import { prisma } from '../db';
import { sendPushNotification } from './push.service';
import { createNotification } from './notifications.service';

export function startScheduler(): void {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMin = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;

    const tasks = await prisma.recurringTask.findMany({
      where: {
        archived: false,
        reminderEnabled: true,
        timeOfDay: { not: null },
      },
    });

    for (const task of tasks) {
      if (!task.timeOfDay) continue;

      const [taskHour, taskMin] = task.timeOfDay.split(':').map(Number);
      const taskMinutes = taskHour * 60 + taskMin;
      const reminderMinutes = taskMinutes - task.reminderMinutesBefore;
      const reminderHour = Math.floor(reminderMinutes / 60);
      const reminderMin = reminderMinutes % 60;
      const reminderTime = `${reminderHour.toString().padStart(2, '0')}:${reminderMin.toString().padStart(2, '0')}`;

      if (reminderTime !== currentTime) continue;

      const completion = await prisma.taskCompletion.findFirst({
        where: { recurringTaskId: task.id, date: todayStr },
      });
      if (completion?.completedCount && completion.completedCount > 0) continue;
      if (completion?.skipped) continue;

      await createNotification({
        userId: task.userId,
        title: `${task.icon} ${task.title}`,
        body: `Reminder: ${task.title}`,
        url: '/',
        source: 'system',
      });

      const subs = await prisma.pushSubscription.findMany({
        where: { userId: task.userId },
      });

      for (const sub of subs) {
        await sendPushNotification(
          sub,
          {
            title: `${task.icon} ${task.title}`,
            body: `Reminder: ${task.title}`,
            url: '/',
          },
          task.userId
        );
      }
    }
  });

  console.log('📅 Reminder scheduler running (every minute)');
}
