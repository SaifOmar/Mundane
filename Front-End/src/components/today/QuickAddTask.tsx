import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export function QuickAddTask() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const { create } = useTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await create({ title: title.trim() });
      setTitle('');
      setOpen(false);
      toast.success('Task added');
    } catch {
      toast.error('Failed to add task');
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 border-2 border-dashed border-border-default rounded-xl text-text-muted text-sm flex items-center justify-center gap-2 hover:border-amber-500/30 hover:text-text-secondary transition-all"
      >
        <Plus size={16} /> Quick add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 animate-scale-in">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full bg-transparent text-text-primary text-sm placeholder:text-text-muted outline-none"
        onKeyDown={e => e.key === 'Escape' && setOpen(false)}
      />
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary">Cancel</button>
        <button type="submit" className="px-3 py-1.5 text-xs rounded-md bg-amber-500 text-stone-900 font-medium hover:bg-amber-400">Add</button>
      </div>
    </form>
  );
}
