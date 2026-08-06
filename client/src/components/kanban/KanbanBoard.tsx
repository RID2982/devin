import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { TASK_STATUSES } from '@app/shared';
import type { TaskRecord } from '@/features/tasks/useTasks';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

export function KanbanBoard({ tasks, onStatusChange }: { tasks: TaskRecord[]; onStatusChange: (id: string, status: string) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStatus = String(over.id);
    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) onStatusChange(taskId, newStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tasks={tasks.filter((t) => t.status === status)} />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({ status, tasks }: { status: string; tasks: TaskRecord[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className={cn('flex min-h-40 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2', isOver && 'ring-2 ring-primary')}>
      <div className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
        <span>{status.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
        <span>{tasks.length}</span>
      </div>
      {tasks.map((task) => (
        <KanbanCard key={task.id} task={task} />
      ))}
    </div>
  );
}
