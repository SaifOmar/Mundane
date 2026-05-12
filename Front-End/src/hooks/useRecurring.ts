import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { RecurringTask, CreateRecurringTaskInput, UpdateRecurringTaskInput } from '@mundane/types';

export function useRecurring() {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<RecurringTask[]>('/recurring');
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (input: CreateRecurringTaskInput) => {
    const task = await api.post<RecurringTask>('/recurring', input);
    setTasks(prev => [...prev, task]);
    return task;
  }, []);

  const update = useCallback(async (id: string, input: UpdateRecurringTaskInput) => {
    const task = await api.patch<RecurringTask>(`/recurring/${id}`, input);
    setTasks(prev => prev.map(t => t.id === id ? task : t));
    return task;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/recurring/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const reorder = useCallback(async (orderedIds: string[]) => {
    await api.patch('/recurring/reorder', { orderedIds });
    setTasks(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      return orderedIds.map((id, i) => ({ ...map.get(id)!, sortOrder: i }));
    });
  }, []);

  return { tasks, loading, create, update, remove, reorder, refetch: fetch };
}
