import { useState } from 'react';
import type { RecurringTask, TaskCompletion } from '@mundane/types';
import { Check, SkipForward, RotateCcw, MessageSquare } from 'lucide-react';

interface Props {
  task: RecurringTask;
  completion: TaskCompletion;
  onToggle: (completionId: string, action: 'complete' | 'skip' | 'reset' | 'increment') => Promise<any>;
}

export function TaskCheckItem({ task, completion, onToggle }: Props) {
  const [animating, setAnimating] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const isCompleted = completion.completedCount >= task.timesPerDay && !completion.skipped;
  const isSkipped = completion.skipped;
  const isPartial = task.timesPerDay > 1 && completion.completedCount > 0 && completion.completedCount < task.timesPerDay;

  const handleClick = async () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    if (isCompleted) {
      await onToggle(completion.id, 'reset');
    } else if (task.timesPerDay > 1) {
      await onToggle(completion.id, 'increment');
    } else {
      await onToggle(completion.id, 'complete');
    }
  };

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSkipped) {
      await onToggle(completion.id, 'reset');
    } else {
      await onToggle(completion.id, 'skip');
    }
  };

  return (
    <div
      className={`card px-4 py-3 flex items-center gap-3 group cursor-pointer transition-all duration-200 ${
        isCompleted
          ? 'border-success/20 bg-success/5'
          : isSkipped
            ? 'border-skip/20 bg-skip/5 opacity-60'
            : 'hover:border-amber-500/20'
      }`}
      onClick={handleClick}
    >
      {/* Checkbox */}
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          isCompleted
            ? 'bg-success border-success text-white'
            : isSkipped
              ? 'bg-skip/20 border-skip text-skip'
              : isPartial
                ? 'border-amber-400 text-amber-400'
                : 'border-border-default group-hover:border-text-muted'
        } ${animating ? 'animate-check-pop' : ''}`}
      >
        {isCompleted && <Check size={14} strokeWidth={3} />}
        {isSkipped && <SkipForward size={12} />}
        {isPartial && (
          <span className="text-[10px] font-bold">{completion.completedCount}</span>
        )}
      </div>

      {/* Icon + title */}
      <span className="text-lg flex-shrink-0">{task.icon}</span>
      <span
        className={`text-sm font-medium flex-1 transition-all ${
          isCompleted ? 'line-through text-text-muted' : isSkipped ? 'line-through text-text-muted' : 'text-text-primary'
        }`}
      >
        {task.title}
      </span>

      {/* Multi-per-day counter */}
      {task.timesPerDay > 1 && !isSkipped && (
        <span className="text-xs text-text-muted font-medium tabular-nums">
          {completion.completedCount}/{task.timesPerDay}
        </span>
      )}

      {/* Time */}
      {task.timeOfDay && (
        <span className="text-xs text-text-muted hidden sm:inline">
          {task.timeOfDay}
        </span>
      )}

      {/* Actions (show on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleSkip}
          className={`p-1 rounded transition-colors ${
            isSkipped ? 'text-skip' : 'text-text-muted hover:text-skip'
          }`}
          title={isSkipped ? 'Unskip' : 'Skip'}
        >
          {isSkipped ? <RotateCcw size={14} /> : <SkipForward size={14} />}
        </button>
      </div>

      {/* Category color dot */}
      {task.category && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: task.category.color }}
          title={task.category.name}
        />
      )}
    </div>
  );
}
