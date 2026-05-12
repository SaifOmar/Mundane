import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Bell, BellOff, Upload, FileText, X, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

type ImportResult = {
  tasksCreated: number;
  tasksErrors: string[];
  recurringCreated: number;
  recurringErrors: string[];
  categoriesCreated?: number;
  categoriesErrors?: string[];
};

export function SettingsPage() {
  const { data: session } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  const [importMode, setImportMode] = useState<'paste' | 'file'>('paste');
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState<{ tasks: Record<string, unknown>[]; recurringTasks: Record<string, unknown>[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDocs, setShowDocs] = useState(false);

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
      if (permission !== 'granted') { toast.error('Permission denied'); return; }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const vapidRes = await fetch('/api/notifications/vapid-public-key');
      const { data: vapidKey } = await vapidRes.json();
      if (!vapidKey) { toast.error('VAPID key not configured on server'); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      const subJson = sub.toJSON();
      await fetch('/api/notifications/subscribe', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subJson.endpoint, p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth }),
      });
      setNotificationsEnabled(true);
      toast.success('Notifications enabled!');
    } catch (err: any) { toast.error(err.message || 'Failed to enable notifications'); }
  };

  const parseJson = (text: string) => {
    setJsonInput(text);
    setImportResult(null);
    setParseError(null);
    setParsedData(null);

    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed == null || typeof parsed !== 'object') {
        setParseError('JSON must be an object with "tasks" and/or "recurringTasks" arrays');
        return;
      }
      if (!parsed.tasks && !parsed.recurringTasks && !parsed.categories) {
        setParseError('JSON must contain a "tasks", "recurringTasks", or "categories" array');
        return;
      }
      if (parsed.tasks && !Array.isArray(parsed.tasks)) {
        setParseError('"tasks" must be an array');
        return;
      }
      if (parsed.recurringTasks && !Array.isArray(parsed.recurringTasks)) {
        setParseError('"recurringTasks" must be an array');
        return;
      }
      if (parsed.categories && !Array.isArray(parsed.categories)) {
        setParseError('"categories" must be an array');
        return;
      }
      setParsedData({
        tasks: parsed.tasks || [],
        recurringTasks: parsed.recurringTasks || [],
        categories: parsed.categories || [],
      } as any);
    } catch (e) {
      setParseError(`Invalid JSON: ${(e as Error).message}`);
    }
  };

  const handleFile = (file: File) => {
    setImportResult(null);
    setParseError(null);
    setParsedData(null);
    const reader = new FileReader();
    reader.onload = () => parseJson(reader.result as string);
    reader.onerror = () => setParseError('Failed to read file');
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.upload<ImportResult>('/tasks/import', parsedData);
      setImportResult(result);
      const total = result.tasksCreated + result.recurringCreated + (result.categoriesCreated ?? 0);
      const totalErrors = result.tasksErrors.length + result.recurringErrors.length + (result.categoriesErrors?.length ?? 0);
      if (total > 0 && totalErrors === 0) toast.success(`Imported ${total} item${total !== 1 ? 's' : ''}`);
      else if (total > 0) toast.success(`Imported ${total} item${total !== 1 ? 's' : ''} with ${totalErrors} error${totalErrors !== 1 ? 's' : ''}`);
      else toast.error('No items were imported');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('401') || msg.includes('Unauthorized')) setParseError('Session expired. Please log in again.');
      else if (msg.includes('fetch')) setParseError('Could not reach server. Check your connection.');
      else setParseError(msg);
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setJsonInput('');
    setParsedData(null);
    setParseError(null);
    setImportResult(null);
  };

  const parsedCategories = (parsedData as any)?.categories?.length ?? 0;
  const totalTasks = (parsedData?.tasks.length ?? 0) + (parsedData?.recurringTasks.length ?? 0);
  const totalErrors = importResult ? importResult.tasksErrors.length + importResult.recurringErrors.length + (importResult.categoriesErrors?.length ?? 0) : 0;
  const allErrors = importResult ? [...importResult.tasksErrors, ...importResult.recurringErrors, ...(importResult.categoriesErrors ?? [])] : [];

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
              {notificationsEnabled ? <Bell size={18} className="text-success" /> : <BellOff size={18} className="text-text-muted" />}
              <div>
                <p className="text-sm text-text-primary">Push Notifications</p>
                <p className="text-xs text-text-muted">
                  {notificationsEnabled ? "Enabled — you'll get reminders" : 'Enable to receive task reminders'}
                </p>
              </div>
            </div>
            <button onClick={toggleNotifications}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${notificationsEnabled ? 'bg-success/10 text-success' : 'bg-amber-500 text-stone-900 hover:bg-amber-400'}`}>
              {notificationsEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>
        )}
      </section>

      {/* Import Tasks */}
      <section className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary">Import Tasks</h2>
          <button onClick={() => setShowDocs(true)} className="flex items-center gap-1 text-xs text-text-muted hover:text-amber-400 transition-colors">
            <HelpCircle size={14} /> Format reference
          </button>
        </div>

        {importResult && (
          <div className="mb-4 space-y-2">
            {(importResult.tasksCreated > 0 || importResult.recurringCreated > 0 || (importResult.categoriesCreated ?? 0) > 0) && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
                <CheckCircle size={16} />
                Imported{importResult.tasksCreated > 0 ? ` ${importResult.tasksCreated} one-off${importResult.tasksCreated !== 1 ? 's' : ''}` : ''}
                {importResult.tasksCreated > 0 && importResult.recurringCreated > 0 && ' +'}
                {importResult.recurringCreated > 0 ? ` ${importResult.recurringCreated} recurring` : ''}
                {(importResult.tasksCreated > 0 || importResult.recurringCreated > 0) && (importResult.categoriesCreated ?? 0) > 0 ? ' +' : ''}
                {(importResult.categoriesCreated ?? 0) > 0 ? ` ${importResult.categoriesCreated} categor${importResult.categoriesCreated === 1 ? 'y' : 'ies'}` : ''}
              </div>
            )}
            {allErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                <p className="text-xs font-medium text-danger mb-2 flex items-center gap-1">
                  <AlertCircle size={14} /> {allErrors.length} error{allErrors.length !== 1 ? 's' : ''}
                </p>
                <ul className="space-y-1">
                  {allErrors.map((err, i) => (
                    <li key={i} className="text-xs text-danger/80 font-mono">{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Input method tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-bg-raised rounded-lg w-fit">
          <button onClick={() => { setImportMode('paste'); resetImport(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${importMode === 'paste' ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
            <FileText size={14} /> Paste JSON
          </button>
          <button onClick={() => { setImportMode('file'); resetImport(); fileInputRef.current?.click(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${importMode === 'file' ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
            <Upload size={14} /> Upload file
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept=".json" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

        {importMode === 'paste' && (
          <textarea value={jsonInput} onChange={e => parseJson(e.target.value)}
            placeholder={'{\n  "tasks": [\n    { "title": "Fix bug", "priority": "HIGH" }\n  ],\n  "recurringTasks": [\n    { "title": "Workout", "frequency": "DAILY" }\n  ]\n}'}
            className="w-full h-36 px-3 py-2.5 rounded-lg bg-bg-raised border border-border-default text-text-primary text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-amber-500/40 transition-all resize-none" />
        )}

        {importMode === 'file' && (
          <div className="flex flex-col items-center justify-center h-36 rounded-lg bg-bg-raised border-2 border-dashed border-border-default text-text-muted">
            <Upload size={24} className="mb-2" />
            <p className="text-sm">Click "Upload file" above to select a .json file</p>
          </div>
        )}

        {/* Parse error */}
        {parseError && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
            <AlertCircle size={14} className="text-danger mt-0.5 flex-shrink-0" />
            <p className="text-xs text-danger">{parseError}</p>
          </div>
        )}

        {/* Preview */}
        {parsedData && !parseError && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <FileText size={16} />
              <span className="font-medium">{totalTasks} task{totalTasks !== 1 ? 's' : ''} found:</span>
            </div>
            {parsedData.recurringTasks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">Recurring ({parsedData.recurringTasks.length})</p>
                <div className="space-y-1">
                  {parsedData.recurringTasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-text-primary py-0.5">
                      <span className="text-xs text-amber-400">⟳</span>
                      <span>{String(t.title)}</span>
                      {!!t.timeOfDay && <span className="text-xs text-text-muted ml-auto">{String(t.timeOfDay)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {parsedData.tasks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">One-off ({parsedData.tasks.length})</p>
                <div className="space-y-1">
                  {parsedData.tasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-text-primary py-0.5">
                      <span className="text-xs text-text-muted">•</span>
                      <span>{String(t.title)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setImportMode('paste'); resetImport(); }} className="px-4 py-2 text-xs text-text-muted hover:text-text-primary">Clear</button>
              <button onClick={handleImport} disabled={importing || totalTasks === 0}
                className="px-4 py-2 text-xs rounded-lg bg-amber-500 text-stone-900 font-medium hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed">
                {importing ? 'Importing...' : `Import ${totalTasks} task${totalTasks !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Docs modal */}
      {showDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDocs(false)}>
          <div className="bg-bg-surface border border-border-default rounded-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
              <h2 className="text-base font-semibold text-text-primary">JSON Import Format</h2>
              <button onClick={() => setShowDocs(false)} className="p-1 rounded text-text-muted hover:text-text-primary"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-text-secondary">
              <p className="text-text-muted">Send a <code className="text-amber-400">POST /api/tasks/import</code> with this structure:</p>
              <pre className="p-3 rounded-lg bg-bg-raised text-text-muted font-mono text-[11px] leading-relaxed">{`{
  "tasks": [...],
  "recurringTasks": [...]
}`}</pre>

              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">Default Categories</h3>
                <p className="text-text-muted mb-2">These categories are available out of the box — reference them by name via <code className="text-amber-400">categoryName</code>:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: '🏃', name: 'Health' },
                    { icon: '💼', name: 'Work' },
                    { icon: '📚', name: 'Learning' },
                    { icon: '🧘', name: 'Mindfulness' },
                    { icon: '👥', name: 'Social' },
                    { icon: '💰', name: 'Finance' },
                    { icon: '🏠', name: 'Home' },
                    { icon: '🎨', name: 'Creative' },
                  ].map(c => (
                    <div key={c.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-raised">
                      <span>{c.icon}</span>
                      <span className="text-text-primary text-xs font-medium">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">One-off Tasks (<code className="text-amber-400">tasks</code>)</h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-text-muted"><th className="text-left py-1 pr-3">Field</th><th className="text-left py-1 pr-3">Type</th><th className="text-left py-1">Default</th></tr></thead>
                  <tbody className="text-text-secondary">
                    <tr><td className="py-1 pr-3 text-amber-400">title</td><td className="py-1 pr-3">string</td><td className="py-1"><span className="text-danger">required</span></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">categoryName</td><td className="py-1 pr-3">string (default category name)</td><td className="py-1"><code className="text-text-muted">null</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">priority</td><td className="py-1 pr-3">LOW | MEDIUM | HIGH</td><td className="py-1"><code className="text-text-muted">MEDIUM</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">status</td><td className="py-1 pr-3">TODO | IN_PROGRESS | DONE</td><td className="py-1"><code className="text-text-muted">TODO</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">dueDate</td><td className="py-1 pr-3">ISO date or null</td><td className="py-1"><code className="text-text-muted">null</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">description</td><td className="py-1 pr-3">string or null</td><td className="py-1"><code className="text-text-muted">null</code></td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">Recurring Tasks (<code className="text-amber-400">recurringTasks</code>)</h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-text-muted"><th className="text-left py-1 pr-3">Field</th><th className="text-left py-1 pr-3">Type</th><th className="text-left py-1">Default</th></tr></thead>
                  <tbody className="text-text-secondary">
                    <tr><td className="py-1 pr-3 text-amber-400">title</td><td className="py-1 pr-3">string</td><td className="py-1"><span className="text-danger">required</span></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">categoryName</td><td className="py-1 pr-3">string (default category name)</td><td className="py-1"><code className="text-text-muted">null</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">frequency</td><td className="py-1 pr-3">DAILY | WEEKDAYS | WEEKENDS | CUSTOM</td><td className="py-1"><code className="text-text-muted">DAILY</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">daysOfWeek</td><td className="py-1 pr-3">number[] (0=Sun..6=Sat)</td><td className="py-1"><code className="text-text-muted">[]</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">timesPerDay</td><td className="py-1 pr-3">number</td><td className="py-1"><code className="text-text-muted">1</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">timeOfDay</td><td className="py-1 pr-3">"HH:MM" or null</td><td className="py-1"><code className="text-text-muted">null</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">icon</td><td className="py-1 pr-3">emoji</td><td className="py-1"><code className="text-text-muted">✅</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">reminderEnabled</td><td className="py-1 pr-3">boolean</td><td className="py-1"><code className="text-text-muted">false</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">reminderMinutesBefore</td><td className="py-1 pr-3">number</td><td className="py-1"><code className="text-text-muted">15</code></td></tr>
                    <tr><td className="py-1 pr-3 text-amber-400">archived</td><td className="py-1 pr-3">boolean</td><td className="py-1"><code className="text-text-muted">false</code></td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">Example</h3>
                <pre className="p-3 rounded-lg bg-bg-raised text-text-muted font-mono text-[11px] leading-relaxed">{`{
  "tasks": [
    { "title": "Fix bug",           "priority": "HIGH", "categoryName": "Work" }
  ],
  "recurringTasks": [
    { "title": "Workout",           "frequency": "DAILY",    "timeOfDay": "06:00", "categoryName": "Health" },
    { "title": "Read 30 min",       "frequency": "DAILY",    "timeOfDay": "21:00", "categoryName": "Learning" },
    { "title": "Morning standup",   "frequency": "WEEKDAYS", "timeOfDay": "09:30", "categoryName": "Work" }
  ]
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">About</h2>
        <p className="text-xs text-text-muted">Mundane — Your local daily task tracker. All data stays on your machine.</p>
      </section>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
