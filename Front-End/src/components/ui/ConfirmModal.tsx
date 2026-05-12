import { useEffect, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', confirmDanger, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-bg-surface border border-border-default rounded-xl w-full max-w-sm mx-4 p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${confirmDanger ? 'bg-danger/10' : 'bg-amber-500/10'}`}>
            <AlertTriangle size={18} className={confirmDanger ? 'text-danger' : 'text-amber-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            <div className="text-xs text-text-muted mt-1">{message}</div>
          </div>
          <button onClick={onCancel} className="p-0.5 rounded text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-4 py-2 text-xs text-text-muted hover:text-text-primary transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-xs rounded-lg font-medium text-white transition-colors ${confirmDanger ? 'bg-danger hover:bg-red-600' : 'bg-amber-500 text-stone-900 hover:bg-amber-400'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
