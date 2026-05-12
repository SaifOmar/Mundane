import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import type { DailyTrend } from '@pt/types';

export function DailyTrendChart({ data }: { data: DailyTrend[] }) {
  if (data.length === 0) return <p className="text-sm text-text-muted">No data yet</p>;

  const chartData = data.map(d => ({
    ...d,
    pct: Math.round(d.completionRate * 100),
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: '8px', fontSize: '12px', color: '#fafaf9' }}
            formatter={(value: number) => [`${value}%`, 'Completion']}
          />
          <Area type="monotone" dataKey="pct" stroke="#f59e0b" strokeWidth={2} fill="url(#trendGradient)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
