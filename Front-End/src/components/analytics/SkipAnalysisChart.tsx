import type { SkipAnalysis } from '@mundane/types';

export function SkipAnalysisChart({ data }: { data: SkipAnalysis[] }) {
  if (data.length === 0) return <p className="text-sm text-text-muted">No data yet</p>;

  return (
    <div className="space-y-3">
      {data.map(task => {
        const total = task.completed + task.skipped + task.missed;
        if (total === 0) return null;
        const cPct = (task.completed / total) * 100;
        const sPct = (task.skipped / total) * 100;
        const mPct = (task.missed / total) * 100;

        return (
          <div key={task.taskId}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-primary flex items-center gap-2">
                <span>{task.taskIcon}</span>
                <span className="truncate max-w-[160px]">{task.taskTitle}</span>
              </span>
              <div className="flex gap-2 text-xs text-text-muted">
                <span className="text-success">{task.completed}✓</span>
                <span className="text-skip">{task.skipped}↷</span>
                <span className="text-danger">{task.missed}✗</span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-bg-raised">
              <div className="h-full bg-success transition-all" style={{ width: `${cPct}%` }} />
              <div className="h-full bg-skip transition-all" style={{ width: `${sPct}%` }} />
              <div className="h-full bg-danger/60 transition-all" style={{ width: `${mPct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="flex gap-4 text-xs text-text-muted mt-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Done</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-skip" /> Skipped</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger/60" /> Missed</span>
      </div>
    </div>
  );
}
