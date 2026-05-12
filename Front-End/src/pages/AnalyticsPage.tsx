import { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ActivityHeatmap } from '@/components/analytics/ActivityHeatmap';
import { CompletionRateChart } from '@/components/analytics/CompletionRateChart';
import { DailyTrendChart } from '@/components/analytics/DailyTrendChart';
import { TimeDistributionChart } from '@/components/analytics/TimeDistributionChart';
import { SkipAnalysisChart } from '@/components/analytics/SkipAnalysisChart';

const RANGES = ['7d', '30d', '90d', '365d'] as const;

export function AnalyticsPage() {
  const [range, setRange] = useState<string>('30d');
  const { data, loading } = useAnalytics(range);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-8 w-48" />
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-64 w-full" />)}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted mt-1">Your habit patterns</p>
        </div>
        <div className="flex gap-1 p-1 bg-bg-raised rounded-lg">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${range === r ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Heatmap */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Activity</h2>
          <ActivityHeatmap data={data.heatmap} />
        </section>

        {/* Two-column charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="card p-5">
            <h2 className="text-sm font-semibold text-text-secondary mb-4">Completion Rate</h2>
            <CompletionRateChart data={data.perTask} />
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold text-text-secondary mb-4">Skip Analysis</h2>
            <SkipAnalysisChart data={data.skipAnalysis} />
          </section>
        </div>

        {/* Trend */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Daily Trend</h2>
          <DailyTrendChart data={data.dailyTrend} />
        </section>

        {/* Time distribution */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Time of Day</h2>
          <TimeDistributionChart data={data.timeDistribution} />
        </section>
      </div>
    </div>
  );
}
