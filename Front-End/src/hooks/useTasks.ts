import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@mundane/types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<Task[]>('/tasks');
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (input: CreateTaskInput) => {
    const task = await api.post<Task>('/tasks', input);
    setTasks(prev => [task, ...prev]);
    return task;
  }, []);

  const update = useCallback(async (id: string, input: UpdateTaskInput) => {
    const task = await api.patch<Task>(`/tasks/${id}`, input);
    setTasks(prev => prev.map(t => t.id === id ? task : t));
    return task;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const duplicate = useCallback(async (id: string) => {
    const task = await api.post<Task>(`/tasks/${id}/duplicate`, {});
    setTasks(prev => [task, ...prev]);
    return task;
  }, []);

  const batchComplete = useCallback(async (ids: string[]) => {
    await api.patch('/tasks/batch/complete', { ids });
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'DONE' as const, completedAt: new Date().toISOString() } : t));
  }, []);

  const batchDelete = useCallback(async (ids: string[]) => {
    await api.delete('/tasks/batch', { ids });
    setTasks(prev => prev.filter(t => !ids.includes(t.id)));
  }, []);

  const importTasks = useCallback(async (data: {
    tasks?: CreateTaskInput[];
    recurringTasks?: Record<string, unknown>[];
  }) => {
    return await api.upload<{
      tasksCreated: number;
      tasksErrors: string[];
      recurringCreated: number;
      recurringErrors: string[];
    }>('/tasks/import', data);
  }, []);

  return { tasks, loading, create, update, remove, duplicate, batchComplete, batchDelete, importTasks, refetch: fetch };
}
