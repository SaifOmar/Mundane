import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { TimeDistribution } from '@mundane/types';

export function TimeDistributionChart({ data }: { data: TimeDistribution[] }) {
  const hasData = data.some(d => d.count > 0);
  if (!hasData) return <p className="text-sm text-text-muted">No data yet</p>;

  const chartData = data.map(d => ({
    ...d,
    label: `${d.hour.toString().padStart(2, '0')}:00`,
  }));

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#78716c' }} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: '8px', fontSize: '12px', color: '#fafaf9' }}
            formatter={(value: number) => [value, 'Completions']}
          />
          <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
