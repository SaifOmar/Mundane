import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AnalyticsData } from '@pt/types';

export function useAnalytics(range: string = '30d') {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.get<AnalyticsData>(`/analytics?range=${range}`);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}
