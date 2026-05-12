import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { TodayData, TaskCompletion } from '@mundane/types';

export function useToday() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const result = await api.get<TodayData>('/today');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleCompletion = useCallback(async (
    completionId: string,
    action: 'complete' | 'skip' | 'reset' | 'increment'
  ) => {
    const updated = await api.patch<TaskCompletion>(
      `/today/completions/${completionId}`,
      { action }
    );
    // Optimistic: update local state
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        recurringTasks: prev.recurringTasks.map(t =>
          t.todayCompletion.id === completionId
            ? { ...t, todayCompletion: updated }
            : t
        ),
        stats: {
          ...prev.stats,
          completedRecurring: prev.recurringTasks.filter(t => {
            const c = t.todayCompletion.id === completionId ? updated : t.todayCompletion;
            return c.completedCount > 0 && !c.skipped;
          }).length,
          skippedRecurring: prev.recurringTasks.filter(t => {
            const c = t.todayCompletion.id === completionId ? updated : t.todayCompletion;
            return c.skipped;
          }).length,
        },
      };
    });
    return updated;
  }, []);

  return { data, loading, error, refetch: fetch, toggleCompletion };
}
