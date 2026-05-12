import { useState, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import { Plus, Trash2, Check, Clock, Pencil, Copy, Square, CheckSquare, X } from 'lucide-react';
import type { Priority, Task } from '@mundane/types';

const PRIORITY_COLORS = { HIGH: 'text-danger', MEDIUM: 'text-warning', LOW: 'text-text-muted' };
const PRIORITY_LABELS = { HIGH: 'High', MEDIUM: 'Med', LOW: 'Low' };

type ContextMenu = {
  x: number;
  y: number;
  task: Task;
};

export function TasksPage() {
  const { tasks, create, update, remove, duplicate, batchComplete, batchDelete, refetch, loading } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'DONE';
    if (filter === 'done') return t.status === 'DONE';
    return true;
  });

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const resetForm = () => {
    setTitle(''); setPriority('MEDIUM'); setDueDate('');
    setShowForm(false); setEditingTask(null);
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const input = { title: title.trim(), priority, dueDate: dueDate || undefined } as any;
      if (editingTask) {
        await update(editingTask.id, input);
        toast.success('Task updated');
      } else {
        await create(input);
        toast.success('Task added');
      }
      resetForm();
    } catch { toast.error(editingTask ? 'Failed to update' : 'Failed to add'); }
  };

  const toggleDone = async (id: string, currentStatus: string) => {
    await update(id, { status: currentStatus === 'DONE' ? 'TODO' : 'DONE' });
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
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(t => t.id)));
  }, [allSelected, filtered]);

  const clearSelection = () => setSelectedIds(new Set());

  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, task });
  };

  const handleDuplicate = async (id: string) => {
    try {
      const task = await duplicate(id);
      toast.success(`Duplicated "${task.title}"`);
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleBatchComplete = async () => {
    const ids = Array.from(selectedIds);
    await batchComplete(ids);
    clearSelection();
    toast.success(`Completed ${ids.length} task${ids.length !== 1 ? 's' : ''}`);
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    await batchDelete(ids);
    setBatchDeleteOpen(false);
    clearSelection();
    toast.success(`Deleted ${ids.length} task${ids.length !== 1 ? 's' : ''}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in" onClick={() => setContextMenu(null)}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">OneOffs</h1>
          <p className="text-sm text-text-muted mt-1">One-off to-dos</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-stone-900 text-sm font-medium hover:bg-amber-400 transition-colors">
          <Plus size={16} /> New
        </button>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-bg-raised rounded-lg w-fit">
        {(['active', 'all', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 space-y-4 animate-scale-in">
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-bg-raised border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-amber-500/40 transition-all"
            placeholder="Task title" required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Priority</label>
              <div className="flex gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map(p => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${priority === p ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 'bg-bg-raised text-text-secondary'}`}>
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-raised border border-border-default text-text-primary text-sm focus:outline-none focus:border-amber-500/40 transition-all" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs text-text-muted">Cancel</button>
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
            <button onClick={handleBatchComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-raised text-text-secondary hover:text-success hover:border-success/30 border border-border-default transition-all">
              <Check size={12} /> Complete
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
          <div className="h-px bg-border-default my-1" />
          <button onClick={() => { setDeleteId(contextMenu.task.id); setContextMenu(null); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-danger hover:bg-bg-raised transition-colors text-left">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Task list header */}
      <div className="mb-3 flex items-center gap-2">
        <button onClick={toggleSelectAll} className="p-1 rounded text-text-muted hover:text-text-primary transition-colors" title="Select all">
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{filtered.length} {filter}</span>
      </div>

      <div className="space-y-2 stagger-children">
        {filtered.map(task => (
          <div key={task.id} onContextMenu={e => handleContextMenu(e, task)}
            className={`card px-4 py-3 flex items-center gap-3 group ${task.status === 'DONE' ? 'opacity-50' : ''} ${selectedIds.has(task.id) ? 'ring-1 ring-amber-500/30 bg-amber-500/5' : ''}`}>
            <button onClick={() => toggleSelect(task.id)}
              className="p-0.5 rounded text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
              {selectedIds.has(task.id) ? <CheckSquare size={16} className="text-amber-400" /> : <Square size={16} />}
            </button>
            <button onClick={() => toggleDone(task.id, task.status)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === 'DONE' ? 'bg-success border-success text-white' : 'border-border-default hover:border-text-muted'}`}>
              {task.status === 'DONE' && <Check size={12} strokeWidth={3} />}
            </button>
            <span className={`text-sm flex-1 ${task.status === 'DONE' ? 'line-through text-text-muted' : 'text-text-primary'}`}>{task.title}</span>
            {task.dueDate && <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={10} />{task.dueDate}</span>}
            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority as Priority]}`}>{PRIORITY_LABELS[task.priority as Priority]}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => handleDuplicate(task.id)} className="p-1 rounded text-text-muted hover:text-amber-400" title="Duplicate"><Copy size={14} /></button>
              <button onClick={() => startEdit(task)} className="p-1 rounded text-text-muted hover:text-amber-400" title="Edit"><Pencil size={14} /></button>
              <button onClick={() => setDeleteId(task.id)}
                className="p-1 rounded text-text-muted hover:text-danger"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">{filter === 'done' ? '🏆' : '📭'}</div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {filter === 'done' ? 'No completed tasks' : 'No tasks'}
          </h3>
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="Delete task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        confirmDanger
        onConfirm={() => { if (deleteId) remove(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        open={batchDeleteOpen}
        title={`Delete ${selectedIds.size} tasks`}
        message={`Are you sure you want to delete ${selectedIds.size} tasks? This cannot be undone.`}
        confirmLabel="Delete all"
        confirmDanger
        onConfirm={handleBatchDelete}
        onCancel={() => setBatchDeleteOpen(false)}
      />
    </div>
  );
}
