import { useDraggable } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import type { TaskRecord } from '@/features/tasks/useTasks';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PRIORITY_ACCENT: Record<string, string> = {
  Low: 'bg-muted-foreground/30',
  Medium: 'bg-sky-500',
  High: 'bg-amber-500',
  Critical: 'bg-destructive',
};

export function KanbanCard({ task }: { task: TaskRecord }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab touch-none select-none overflow-hidden rounded-xl',
        isDragging && 'z-10 opacity-70 shadow-lg',
      )}
    >
      <div className="flex">
        <div className={cn('w-1 shrink-0', PRIORITY_ACCENT[task.priority] ?? 'bg-muted-foreground/30')} />
        <CardContent className="min-w-0 flex-1 space-y-1.5 p-3">
          <Link to={`/events/${task.eventId}`} onClick={(e) => e.stopPropagation()} className="text-sm font-medium hover:underline">
            {task.title}
          </Link>
          <div className="flex items-center justify-between">
            <PriorityBadge priority={task.priority} />
            {task.deadline && <span className="text-xs text-muted-foreground">{formatDate(task.deadline)}</span>}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
