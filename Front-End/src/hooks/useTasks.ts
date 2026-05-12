import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@pt/types';

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

  return { tasks, loading, create, update, remove, refetch: fetch };
}
