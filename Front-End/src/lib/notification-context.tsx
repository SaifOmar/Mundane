import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from './api';

type NotificationContextType = {
  unreadCount: number;
  refresh: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refresh: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const result = await api.get<{ count: number }>('/notifications/reminders/unread-count');
      setUnreadCount(result.count);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
