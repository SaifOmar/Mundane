import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { Plus, Trash2, Check, Circle, Clock, Pencil } from 'lucide-react';
import type { Priority, Task } from '@mundane/types';

const PRIORITY_COLORS = { HIGH: 'text-danger', MEDIUM: 'text-warning', LOW: 'text-text-muted' };
const PRIORITY_LABELS = { HIGH: 'High', MEDIUM: 'Med', LOW: 'Low' };

export function TasksPage() {
  const { tasks, create, update, remove, loading } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active');

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'DONE';
    if (filter === 'done') return t.status === 'DONE';
    return true;
  });

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Tasks</h1>
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

      <div className="space-y-2 stagger-children">
        {filtered.map(task => (
          <div key={task.id} className={`card px-4 py-3 flex items-center gap-3 group ${task.status === 'DONE' ? 'opacity-50' : ''}`}>
            <button onClick={() => toggleDone(task.id, task.status)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === 'DONE' ? 'bg-success border-success text-white' : 'border-border-default hover:border-text-muted'}`}>
              {task.status === 'DONE' && <Check size={12} strokeWidth={3} />}
            </button>
            <span className={`text-sm flex-1 ${task.status === 'DONE' ? 'line-through text-text-muted' : 'text-text-primary'}`}>{task.title}</span>
            {task.dueDate && <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={10} />{task.dueDate}</span>}
            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority as Priority]}`}>{PRIORITY_LABELS[task.priority as Priority]}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => startEdit(task)} className="p-1 rounded text-text-muted hover:text-amber-400" title="Edit"><Pencil size={14} /></button>
              <button onClick={() => { if (confirm('Delete?')) remove(task.id); }}
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
    </div>
  );
}
