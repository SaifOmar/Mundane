import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Category, TaskList } from '@mundane/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<Category[]>('/categories');
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { categories, loading, refetch: fetch };
}

export function useLists() {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<TaskList[]>('/lists');
      setLists(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (name: string, icon?: string) => {
    const list = await api.post<TaskList>('/lists', { name, icon });
    setLists(prev => [...prev, list]);
    return list;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.delete(`/lists/${id}`);
    setLists(prev => prev.filter(l => l.id !== id));
  }, []);

  return { lists, loading, create, remove, refetch: fetch };
}
