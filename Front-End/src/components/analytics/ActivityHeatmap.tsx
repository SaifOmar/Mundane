import type { HeatmapDay } from '@pt/types';

export function ActivityHeatmap({ data }: { data: HeatmapDay[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">No data yet</p>;
  }

  // Group by week for grid layout
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  // Pad start to align with Sunday
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

  const getColor = (rate: number): string => {
    if (rate < 0) return 'transparent';
    if (rate === 0) return 'rgba(41, 37, 36, 0.8)';
    if (rate < 0.25) return 'rgba(180, 83, 9, 0.3)';
    if (rate < 0.5) return 'rgba(217, 119, 6, 0.45)';
    if (rate < 0.75) return 'rgba(245, 158, 11, 0.6)';
    if (rate < 1) return 'rgba(251, 191, 36, 0.75)';
    return 'rgba(251, 191, 36, 1)';
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-fit">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                className="w-3 h-3 rounded-[2px] transition-colors duration-200"
                style={{ backgroundColor: getColor(day.completionRate) }}
                title={day.date ? `${day.date}: ${day.completed}/${day.total} (${Math.round(day.completionRate * 100)}%)` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-text-muted">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(r => (
          <div key={r} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: getColor(r) }} />
        ))}
        <span className="text-xs text-text-muted">More</span>
      </div>
    </div>
  );
}
