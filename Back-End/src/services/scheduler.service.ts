import cron from 'node-cron';
import { prisma } from '../db';
import { sendPushNotification } from './push.service';

export function startScheduler(): void {
  // Run every minute — check for tasks whose reminder time has come
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMin = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;

    // Find tasks with reminders that should fire now
    const tasks = await prisma.recurringTask.findMany({
      where: {
        archived: false,
        reminderEnabled: true,
        timeOfDay: { not: null },
      },
    });

    for (const task of tasks) {
      if (!task.timeOfDay) continue;

      // Calculate the reminder time (task time minus minutes before)
      const [taskHour, taskMin] = task.timeOfDay.split(':').map(Number);
      const taskMinutes = taskHour * 60 + taskMin;
      const reminderMinutes = taskMinutes - task.reminderMinutesBefore;
      const reminderHour = Math.floor(reminderMinutes / 60);
      const reminderMin = reminderMinutes % 60;
      const reminderTime = `${reminderHour.toString().padStart(2, '0')}:${reminderMin.toString().padStart(2, '0')}`;

      if (reminderTime !== currentTime) continue;

      // Check this task isn't already completed today
      const completion = await prisma.taskCompletion.findFirst({
        where: { recurringTaskId: task.id, date: todayStr },
      });
      if (completion?.completedCount && completion.completedCount > 0) continue;
      if (completion?.skipped) continue;

      // Send push to all subscriptions for this user
      const subs = await prisma.pushSubscription.findMany({
        where: { userId: task.userId },
      });

      for (const sub of subs) {
        await sendPushNotification(sub, {
          title: `${task.icon} ${task.title}`,
          body: `Time to: ${task.title}`,
          url: '/',
        });
      }
    }
  });

  console.log('📅 Reminder scheduler running (every minute)');
}
