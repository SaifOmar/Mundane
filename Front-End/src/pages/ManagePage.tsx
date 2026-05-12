import { useState, useCallback } from 'react';
import { useRecurring } from '@/hooks/useRecurring';
import { useCategories } from '@/hooks/useData';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { Plus, Trash2, Archive, RotateCcw, Pencil, CheckSquare, Square, Copy, X } from 'lucide-react';
import type { Frequency, RecurringTask, CreateRecurringTaskInput } from '@mundane/types';

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'DAILY', label: 'Every day' },
  { value: 'WEEKDAYS', label: 'Weekdays' },
  { value: 'WEEKENDS', label: 'Weekends' },
  { value: 'CUSTOM', label: 'Custom days' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMOJI_OPTIONS = ['✅', '🏋️', '📖', '💻', '🧘', '📝', '💧', '🎯', '🏃', '🎨', '🎵', '🧹', '💊', '🥗', '☕'];

type ContextMenu = {
  x: number;
  y: number;
  task: RecurringTask;
};

export function ManagePage() {
  const { tasks, create, update, remove, duplicate, batchArchive, batchDelete, refetch } = useRecurring();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('✅');
  const [frequency, setFrequency] = useState<Frequency>('DAILY');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const activeTasks = tasks.filter(t => !t.archived);
  const archivedTasks = tasks.filter(t => t.archived);
  const allSelected = activeTasks.length > 0 && selectedIds.size === activeTasks.length;

  const resetForm = () => {
    setTitle(''); setIcon('✅'); setFrequency('DAILY');
    setDaysOfWeek([]); setTimesPerDay(1); setTimeOfDay('');
    setCategoryId(''); setShowForm(false); setEditingTask(null);
  };

  const startEdit = (task: RecurringTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setIcon(task.icon);
    setFrequency(task.frequency);
    setDaysOfWeek(task.daysOfWeek || []);
    setTimesPerDay(task.timesPerDay);
    setTimeOfDay(task.timeOfDay || '');
    setCategoryId(task.categoryId || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const input: Record<string, unknown> = {
        title: title.trim(), icon, frequency,
        daysOfWeek: frequency === 'CUSTOM' ? daysOfWeek : undefined,
        timesPerDay, timeOfDay: timeOfDay || undefined,
        categoryId: categoryId || undefined,
      };
      if (editingTask) {
        await update(editingTask.id, input);
        toast.success('Task updated');
      } else {
        await create(input as unknown as CreateRecurringTaskInput);
        toast.success('Task created');
      }
      resetForm();
    } catch { toast.error(editingTask ? 'Failed to update' : 'Failed to create'); }
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeTasks.map(t => t.id)));
    }
  }, [allSelected, activeTasks]);

  const clearSelection = () => setSelectedIds(new Set());

  const handleBatchArchive = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await batchArchive(ids, true);
    clearSelection();
    toast.success(`Archived ${ids.length} task${ids.length !== 1 ? 's' : ''}`);
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await batchDelete(ids);
    setBatchDeleteOpen(false);
    clearSelection();
    toast.success(`Deleted ${ids.length} task${ids.length !== 1 ? 's' : ''}`);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const task = await duplicate(id);
      toast.success(`Duplicated "${task.title}"`);
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleContextMenu = (e: React.MouseEvent, task: RecurringTask) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, task });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in" onClick={() => setContextMenu(null)}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Recurring</h1>
          <p className="text-sm text-text-muted mt-1">Manage your recurring tasks</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-stone-900 text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 space-y-4 animate-scale-in">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Title</label>
              <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-raised border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-amber-500/40 transition-all"
                placeholder="e.g. Morning exercise" required />
            </div>
          </div>

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

          {frequency === 'CUSTOM' && (
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((name, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${daysOfWeek.includes(i) ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 'bg-bg-raised text-text-secondary'}`}
                >{name}</button>
              ))}
            </div>
          )}

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
            <button type="submit" className="px-4 py-2 text-xs rounded-lg bg-amber-500 text-stone-900 font-medium hover:bg-amber-400">
              {editingTask ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="text-sm text-text-primary font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-1.5 ml-auto">
            <button onClick={handleBatchArchive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-raised text-text-secondary hover:text-warning hover:border-warning/30 border border-border-default transition-all">
              <Archive size={12} /> Archive
            </button>
            <button onClick={() => setBatchDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-raised text-text-secondary hover:text-danger hover:border-danger/30 border border-border-default transition-all">
              <Trash2 size={12} /> Delete
            </button>
            <button onClick={clearSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary transition-colors">
              <X size={12} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-44 rounded-lg bg-bg-surface border border-border-default shadow-xl py-1 animate-scale-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => { toggleSelect(contextMenu.task.id); setContextMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-primary hover:bg-bg-raised transition-colors text-left">
            {selectedIds.has(contextMenu.task.id) ? <CheckSquare size={14} /> : <Square size={14} />}
            Select
          </button>
          <button onClick={() => { handleDuplicate(contextMenu.task.id); setContextMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-primary hover:bg-bg-raised transition-colors text-left">
            <Copy size={14} /> Duplicate
          </button>
          <button onClick={() => { update(contextMenu.task.id, { archived: true }); setContextMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-primary hover:bg-bg-raised transition-colors text-left">
            <Archive size={14} /> Archive
          </button>
          <div className="h-px bg-border-default my-1" />
          <button onClick={() => { setDeleteId(contextMenu.task.id); setContextMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-danger hover:bg-bg-raised transition-colors text-left">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Active tasks */}
      <div className="mb-3 flex items-center gap-2">
        <button onClick={toggleSelectAll} className="p-1 rounded text-text-muted hover:text-text-primary transition-colors" title="Select all">
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{activeTasks.length} active</span>
      </div>

      <div className="space-y-2 stagger-children">
        {activeTasks.map(task => (
          <div
            key={task.id}
            onContextMenu={e => handleContextMenu(e, task)}
            className={`card px-4 py-3 flex items-center gap-3 group transition-all ${selectedIds.has(task.id) ? 'ring-1 ring-amber-500/30 bg-amber-500/5' : ''}`}
          >
            <button onClick={() => toggleSelect(task.id)}
              className="p-0.5 rounded text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
              {selectedIds.has(task.id) ? <CheckSquare size={16} className="text-amber-400" /> : <Square size={16} />}
            </button>
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
              <button onClick={() => handleDuplicate(task.id)} className="p-1.5 rounded text-text-muted hover:text-amber-400" title="Duplicate"><Copy size={14} /></button>
              <button onClick={() => startEdit(task)} className="p-1.5 rounded text-text-muted hover:text-amber-400" title="Edit"><Pencil size={14} /></button>
              <button onClick={() => update(task.id, { archived: true })} className="p-1.5 rounded text-text-muted hover:text-warning" title="Archive"><Archive size={14} /></button>
              <button onClick={() => setDeleteId(task.id)} className="p-1.5 rounded text-text-muted hover:text-danger" title="Delete"><Trash2 size={14} /></button>
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

      <ConfirmModal
        open={deleteId !== null}
        title="Delete routine"
        message="Are you sure you want to delete this routine? This cannot be undone."
        confirmLabel="Delete"
        confirmDanger
        onConfirm={() => { if (deleteId) remove(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        open={batchDeleteOpen}
        title={`Delete ${selectedIds.size} routines`}
        message={`Are you sure you want to delete ${selectedIds.size} routines? This cannot be undone.`}
        confirmLabel="Delete all"
        confirmDanger
        onConfirm={handleBatchDelete}
        onCancel={() => setBatchDeleteOpen(false)}
      />
    </div>
  );
}
