import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useRecurring } from '@/hooks/useRecurring';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import type { Priority, Frequency } from '@mundane/types';

type Props = {
  onAdd?: () => void;
};

export function QuickAddTask({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'task' | 'recurring'>('task');
  const [frequency, setFrequency] = useState<Frequency>('DAILY');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');

  const { create: createTask } = useTasks();
  const { create: createRecurring } = useRecurring();

  const reset = () => {
    setTitle(''); setFrequency('DAILY'); setTimeOfDay('');
    setPriority('MEDIUM'); setDueDate(''); setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      if (type === 'recurring') {
        await createRecurring({ title: title.trim(), frequency, timeOfDay: timeOfDay || undefined });
        toast.success('Routine added');
      } else {
        await createTask({ title: title.trim(), priority, dueDate: dueDate || undefined });
        toast.success('Task added');
      }
      reset();
      onAdd?.();
    } catch { toast.error('Failed to add'); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full py-3 border-2 border-dashed border-border-default rounded-xl text-text-muted text-sm flex items-center justify-center gap-2 hover:border-amber-500/30 hover:text-text-secondary transition-all">
        <Plus size={16} /> Quick add
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 animate-scale-in space-y-3">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full bg-transparent text-text-primary text-sm placeholder:text-text-muted outline-none"
        onKeyDown={e => e.key === 'Escape' && reset()} />

      <div className="flex gap-1 p-0.5 bg-bg-raised rounded-lg w-fit">
        <button type="button" onClick={() => setType('task')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${type === 'task' ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>Task</button>
        <button type="button" onClick={() => setType('recurring')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${type === 'recurring' ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>Routine</button>
      </div>

      {type === 'recurring' && (
        <div className="flex flex-wrap gap-2">
          {(['DAILY', 'WEEKDAYS', 'WEEKENDS'] as Frequency[]).map(f => (
            <button key={f} type="button" onClick={() => setFrequency(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${frequency === f ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 'bg-bg-raised text-text-secondary hover:text-text-primary'}`}
            >{f === 'DAILY' ? 'Every day' : f === 'WEEKDAYS' ? 'Weekdays' : 'Weekends'}</button>
          ))}
          <input type="time" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)}
            className="w-24 px-2 py-1 rounded-md bg-bg-raised border border-border-default text-text-primary text-xs focus:outline-none focus:border-amber-500/40" />
        </div>
      )}

      {type === 'task' && (
        <div className="flex flex-wrap gap-2">
          {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${priority === p ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 'bg-bg-raised text-text-secondary hover:text-text-primary'}`}
            >{p[0] + p.slice(1).toLowerCase()}</button>
          ))}
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="w-32 px-2 py-1 rounded-md bg-bg-raised border border-border-default text-text-primary text-xs focus:outline-none focus:border-amber-500/40" />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={reset} className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary">Cancel</button>
        <button type="submit" className="px-3 py-1.5 text-xs rounded-md bg-amber-500 text-stone-900 font-medium hover:bg-amber-400">
          Add {type === 'recurring' ? 'Routine' : 'Task'}
        </button>
      </div>
    </form>
  );
}
