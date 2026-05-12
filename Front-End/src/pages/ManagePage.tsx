import { useState } from 'react';
import { useRecurring } from '@/hooks/useRecurring';
import { useCategories } from '@/hooks/useData';
import { toast } from 'sonner';
import { Plus, Trash2, Archive, RotateCcw } from 'lucide-react';
import type { Frequency } from '@pt/types';

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'DAILY', label: 'Every day' },
  { value: 'WEEKDAYS', label: 'Weekdays' },
  { value: 'WEEKENDS', label: 'Weekends' },
  { value: 'CUSTOM', label: 'Custom days' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMOJI_OPTIONS = ['✅', '🏋️', '📖', '💻', '🧘', '📝', '💧', '🎯', '🏃', '🎨', '🎵', '🧹', '💊', '🥗', '☕'];

export function ManagePage() {
  const { tasks, create, update, remove } = useRecurring();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('✅');
  const [frequency, setFrequency] = useState<Frequency>('DAILY');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeTasks = tasks.filter(t => !t.archived);
  const archivedTasks = tasks.filter(t => t.archived);

  const resetForm = () => {
    setTitle(''); setIcon('✅'); setFrequency('DAILY');
    setDaysOfWeek([]); setTimesPerDay(1); setTimeOfDay('');
    setCategoryId(''); setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await create({
        title: title.trim(), icon, frequency,
        daysOfWeek: frequency === 'CUSTOM' ? daysOfWeek : undefined,
        timesPerDay, timeOfDay: timeOfDay || undefined,
        categoryId: categoryId || undefined,
      });
      resetForm();
      toast.success('Task created');
    } catch { toast.error('Failed to create'); }
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Routines</h1>
          <p className="text-sm text-text-muted mt-1">Manage your recurring tasks</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-stone-900 text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 mb-6 space-y-4 animate-scale-in">
          {/* Title + emoji */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Title</label>
              <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-raised border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-amber-500/40 transition-all"
                placeholder="e.g. Morning exercise" required />
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} type="button" onClick={() => setIcon(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${icon === e ? 'bg-amber-500/20 ring-1 ring-amber-500/40' : 'bg-bg-raised hover:bg-bg-overlay'}`}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Frequency</label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setFrequency(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${frequency === opt.value ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 'bg-bg-raised text-text-secondary hover:text-text-primary'}`}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Custom days */}
          {frequency === 'CUSTOM' && (
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((name, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${daysOfWeek.includes(i) ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 'bg-bg-raised text-text-secondary'}`}
                >{name}</button>
              ))}
            </div>
          )}

          {/* Times per day + time of day */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Times per day</label>
              <input type="number" min={1} max={50} value={timesPerDay} onChange={e => setTimesPerDay(+e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-raised border border-border-default text-text-primary text-sm focus:outline-none focus:border-amber-500/40 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Time (optional)</label>
              <input type="time" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-raised border border-border-default text-text-primary text-sm focus:outline-none focus:border-amber-500/40 transition-all" />
            </div>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-raised border border-border-default text-text-primary text-sm focus:outline-none focus:border-amber-500/40 transition-all">
                <option value="">None</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs text-text-muted hover:text-text-secondary">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs rounded-lg bg-amber-500 text-stone-900 font-medium hover:bg-amber-400">Create</button>
          </div>
        </form>
      )}

      {/* Active task list */}
      <div className="space-y-2 stagger-children">
        {activeTasks.map(task => (
          <div key={task.id} className="card px-4 py-3 flex items-center gap-3 group">
            <span className="text-lg">{task.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
              <p className="text-xs text-text-muted">
                {task.frequency === 'DAILY' ? 'Every day' : task.frequency === 'WEEKDAYS' ? 'Weekdays' : task.frequency === 'WEEKENDS' ? 'Weekends' : 'Custom'}
                {task.timesPerDay > 1 && ` · ${task.timesPerDay}x/day`}
                {task.timeOfDay && ` · ${task.timeOfDay}`}
              </p>
            </div>
            {task.category && (
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.category.color }} title={task.category.name} />
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => update(task.id, { archived: true })} className="p-1.5 rounded text-text-muted hover:text-warning" title="Archive"><Archive size={14} /></button>
              <button onClick={() => { if (confirm('Delete?')) remove(task.id); }} className="p-1.5 rounded text-text-muted hover:text-danger" title="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {activeTasks.length === 0 && !showForm && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No routines yet</h3>
          <p className="text-sm text-text-muted">Click "New" to create your first daily task</p>
        </div>
      )}

      {/* Archived */}
      {archivedTasks.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowArchived(!showArchived)} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            {showArchived ? 'Hide' : 'Show'} archived ({archivedTasks.length})
          </button>
          {showArchived && (
            <div className="space-y-2 mt-3">
              {archivedTasks.map(task => (
                <div key={task.id} className="card px-4 py-3 flex items-center gap-3 opacity-50">
                  <span className="text-lg">{task.icon}</span>
                  <span className="text-sm text-text-muted flex-1">{task.title}</span>
                  <button onClick={() => update(task.id, { archived: false })} className="p-1.5 rounded text-text-muted hover:text-success" title="Restore"><RotateCcw size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
