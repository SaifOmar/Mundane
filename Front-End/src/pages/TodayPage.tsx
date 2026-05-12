import { useToday } from '@/hooks/useToday';
import { TaskCheckItem } from '@/components/today/TaskCheckItem';
import { QuickAddTask } from '@/components/today/QuickAddTask';
import { CheckCircle2, SkipForward, Circle } from 'lucide-react';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function TodayPage() {
  const { data, loading, toggleCompletion } = useToday();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-32" />
        <div className="space-y-3 mt-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { date, recurringTasks, dueTasks, stats } = data;
  const progressPercent = stats.totalRecurring > 0
    ? Math.round((stats.completedRecurring / stats.totalRecurring) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          {formatDate(date)}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {stats.completedRecurring === stats.totalRecurring && stats.totalRecurring > 0
            ? '🎉 All done for today!'
            : `${stats.completedRecurring} of ${stats.totalRecurring} completed`}
        </p>
      </div>

      {/* Progress bar */}
      {stats.totalRecurring > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-success" />
                {stats.completedRecurring}
              </span>
              <span className="flex items-center gap-1">
                <SkipForward size={12} className="text-skip" />
                {stats.skippedRecurring}
              </span>
              <span className="flex items-center gap-1">
                <Circle size={12} />
                {stats.totalRecurring - stats.completedRecurring - stats.skippedRecurring}
              </span>
            </div>
            <span className="text-xs font-medium text-text-accent">{progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-raised overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Daily tasks */}
      {recurringTasks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Daily Tasks
          </h2>
          <div className="space-y-2 stagger-children">
            {recurringTasks.map(task => (
              <TaskCheckItem
                key={task.id}
                task={task}
                completion={task.todayCompletion}
                onToggle={toggleCompletion}
              />
            ))}
          </div>
        </section>
      )}

      {/* Due today (one-off tasks) */}
      {dueTasks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Due Today
          </h2>
          <div className="space-y-2">
            {dueTasks.map(task => (
              <div
                key={task.id}
                className="card px-4 py-3 flex items-center gap-3"
              >
                <span className="text-sm">{task.title}</span>
                {task.priority === 'HIGH' && (
                  <span className="ml-auto px-2 py-0.5 rounded text-xs bg-danger/10 text-danger font-medium">
                    High
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick add */}
      <QuickAddTask />

      {/* Empty state */}
      {recurringTasks.length === 0 && dueTasks.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🌙</div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No tasks yet</h3>
          <p className="text-sm text-text-muted">
            Head to <span className="text-amber-400">Routines</span> to set up your daily tasks
          </p>
        </div>
      )}
    </div>
  );
}
