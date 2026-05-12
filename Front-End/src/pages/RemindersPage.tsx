import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useNotificationContext } from '@/lib/notification-context';
import type { RemindersResponse, Notification } from '@mundane/types';
import { Bell, BellOff, CheckCheck, ExternalLink, Clock } from 'lucide-react';

export function RemindersPage() {
  const { refresh: refreshUnread } = useNotificationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<RemindersResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchReminders = useCallback(async (cursor?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '50' });
      if (cursor) params.set('cursor', cursor);
      if (unreadOnly) params.set('unreadOnly', 'true');
      const result = await api.get<RemindersResponse>(`/notifications/reminders?${params}`);
      if (cursor) {
        setNotifications(prev => [...prev, ...result.notifications]);
      } else {
        setNotifications(result.notifications);
      }
      setMeta(result.meta);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/reminders/${id}/read`, {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    refreshUnread();
  };

  const markAllRead = async () => {
    await api.patch('/notifications/reminders/read-all', {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    refreshUnread();
  };

  const clickReminder = async (n: Notification) => {
    if (n.url) window.open(n.url, '_self');
    await api.patch(`/notifications/reminders/${n.id}/click`, {});
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true, clickedAt: new Date().toISOString() } : x));
  };

  const loadMore = () => {
    if (meta?.nextCursor) fetchReminders(meta.nextCursor);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Reminders</h1>
          <p className="text-sm text-text-muted mt-1">
            {meta ? `${meta.unreadCount} unread · ${meta.total} total` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${unreadOnly ? 'bg-amber-500/10 text-amber-400' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <BellOff size={16} />
          </button>
          <button
            onClick={markAllRead}
            className="p-2 rounded-lg text-text-muted hover:text-text-secondary transition-all"
            title="Mark all read"
          >
            <CheckCheck size={16} />
          </button>
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-8 text-center">
          <Bell size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted text-sm">No reminders yet</p>
          <p className="text-text-muted text-xs mt-1">
            Notifications from reminders and tasks will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => clickReminder(n)}
              className={`card p-4 cursor-pointer transition-all hover:border-amber-500/20 ${n.read ? 'opacity-70' : 'border-amber-500/10'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${n.read ? 'bg-bg-raised' : 'bg-amber-500/10'}`}>
                  {n.icon || <Bell size={14} className={n.read ? 'text-text-muted' : 'text-amber-400'} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${n.read ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {n.url && <ExternalLink size={12} className="text-text-muted" />}
                      {!n.read && (
                        <button
                          onClick={e => { e.stopPropagation(); markRead(n.id); }}
                          className="p-1 rounded text-text-muted hover:text-amber-400"
                        >
                          <CheckCheck size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {n.body && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{n.body}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock size={10} className="text-text-muted" />
                    <span className="text-xs text-text-muted">{timeAgo(n.sentAt)}</span>
                    {n.deliveredAt && <span className="text-xs text-success">✓ delivered</span>}
                    {!n.deliveredAt && n.source !== 'system' && <span className="text-xs text-warning">pending</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {meta?.nextCursor && (
            <button
              onClick={loadMore}
              className="w-full py-3 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
