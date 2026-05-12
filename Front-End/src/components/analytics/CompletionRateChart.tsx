import type { PerTaskAnalytics } from '@mundane/types';

export function CompletionRateChart({ data }: { data: PerTaskAnalytics[] }) {
  if (data.length === 0) return <p className="text-sm text-text-muted">No data yet</p>;

  const sorted = [...data].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <div className="space-y-3">
      {sorted.map(task => (
        <div key={task.taskId}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-text-primary flex items-center gap-2">
              <span>{task.taskIcon}</span>
              <span className="truncate max-w-[180px]">{task.taskTitle}</span>
            </span>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>🔥 {task.currentStreak}d</span>
              <span className="font-medium text-text-accent">
                {Math.round(task.completionRate * 100)}%
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-bg-raised overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${task.completionRate * 100}%`,
                background: task.completionRate >= 0.8
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : task.completionRate >= 0.5
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
