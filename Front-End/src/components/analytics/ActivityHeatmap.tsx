import type { HeatmapDay } from '@mundane/types';

export function ActivityHeatmap({ data }: { data: HeatmapDay[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">No data yet</p>;
  }

  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  const firstDate = new Date(data[0].date + 'T12:00:00');
  const startDay = firstDate.getDay();
  for (let i = 0; i < startDay; i++) {
    currentWeek.push({ date: '', completionRate: -1, completed: 0, total: 0 });
  }

  for (const day of data) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getColor = (day: HeatmapDay): string => {
    if (day.completionRate < 0) return 'transparent';
    if (day.total === 0) return 'rgba(41, 37, 36, 0.35)';
    if (day.completionRate === 0) return 'rgba(41, 37, 36, 0.85)';
    if (day.completionRate < 0.25) return 'rgba(180, 83, 9, 0.3)';
    if (day.completionRate < 0.5) return 'rgba(217, 119, 6, 0.45)';
    if (day.completionRate < 0.75) return 'rgba(245, 158, 11, 0.6)';
    if (day.completionRate < 1) return 'rgba(251, 191, 36, 0.75)';
    return 'rgba(251, 191, 36, 1)';
  };

  const legendColor = (rate: number): string => {
    if (rate === 0) return 'rgba(41, 37, 36, 0.85)';
    if (rate < 0.25) return 'rgba(180, 83, 9, 0.3)';
    if (rate < 0.5) return 'rgba(217, 119, 6, 0.45)';
    if (rate < 0.75) return 'rgba(245, 158, 11, 0.6)';
    if (rate < 1) return 'rgba(251, 191, 36, 0.75)';
    return 'rgba(251, 191, 36, 1)';
  };

  return (
    <div className="overflow-x-hidden">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                className="w-5 h-5 rounded-[3px] transition-colors duration-200"
                style={{ backgroundColor: getColor(day) }}
                title={
                  !day.date ? '' :
                  day.total === 0 ? `${day.date}: No data` :
                  `${day.date}: ${day.completed}/${day.total} (${Math.round(day.completionRate * 100)}%)`
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-text-muted">No data</span>
        <div className="w-4 h-4 rounded-[2px]" style={{ backgroundColor: 'rgba(41, 37, 36, 0.35)' }} />
        <span className="text-xs text-text-muted">0%</span>
        {[0, 0.25, 0.5, 0.75, 1].map(r => (
          <div key={r} className="w-4 h-4 rounded-[2px]" style={{ backgroundColor: legendColor(r) }} />
        ))}
        <span className="text-xs text-text-muted">100%</span>
      </div>
    </div>
  );
}
