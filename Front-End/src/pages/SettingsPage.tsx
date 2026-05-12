import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';

export function SettingsPage() {
  const { data: session } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
    setChecking(false);
  }, []);

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      toast.info('Disable notifications in your browser settings');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permission denied');
        return;
      }

      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidRes = await fetch('/api/notifications/vapid-public-key');
      const { data: vapidKey } = await vapidRes.json();

      if (!vapidKey) {
        toast.error('VAPID key not configured on server');
        return;
      }

      // Subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const subJson = sub.toJSON();
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        }),
      });

      setNotificationsEnabled(true);
      toast.success('Notifications enabled!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to enable notifications');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Settings</h1>

      {/* Account */}
      <section className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Name</span>
            <span className="text-sm text-text-primary">{session?.user?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Email</span>
            <span className="text-sm text-text-primary">{session?.user?.email}</span>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Notifications</h2>
        {!checking && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell size={18} className="text-success" />
              ) : (
                <BellOff size={18} className="text-text-muted" />
              )}
              <div>
                <p className="text-sm text-text-primary">Push Notifications</p>
                <p className="text-xs text-text-muted">
                  {notificationsEnabled ? 'Enabled — you\'ll get reminders' : 'Enable to receive task reminders'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                notificationsEnabled
                  ? 'bg-success/10 text-success'
                  : 'bg-amber-500 text-stone-900 hover:bg-amber-400'
              }`}
            >
              {notificationsEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>
        )}
      </section>

      {/* About */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">About</h2>
        <p className="text-xs text-text-muted">
          ProjectTasks — Your local daily task tracker. All data stays on your machine.
        </p>
      </section>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
