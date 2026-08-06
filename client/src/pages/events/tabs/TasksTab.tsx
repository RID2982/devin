import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TASK_STATUSES } from '@app/shared';
import { useTasksQuery, useCreateTask, useSetTaskStatus } from '@/features/tasks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { formatDate } from '@/lib/utils';

export function TasksTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useTasksQuery({ eventId, pageSize: 100, sortBy: 'deadline' });
  const createTask = useCreateTask();
  const setStatus = useSetTaskStatus();
  const [title, setTitle] = useState('');

  function addTask() {
    if (!title.trim()) return;
    createTask.mutate({ eventId, title: title.trim() });
    setTitle('');
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        <Button onClick={addTask} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? null : !data?.data.length ? (
        <EmptyState title="No tasks yet" description="Add the first task for this event." />
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {data.data.map((task) => (
            <div key={task.id} className="flex flex-wrap items-center gap-3 p-3">
              <Link to={`/tasks?eventId=${eventId}`} className="flex-1 text-sm font-medium hover:underline">
                {task.title}
              </Link>
              {task.deadline && <span className="text-xs text-muted-foreground">{formatDate(task.deadline)}</span>}
              <PriorityBadge priority={task.priority} />
              <Select value={task.status} onValueChange={(status) => setStatus.mutate({ id: task.id, status })}>
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
