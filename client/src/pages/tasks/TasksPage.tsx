import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import { PRIORITIES, TASK_STATUSES } from '@app/shared';
import { useTasksQuery, useSetTaskStatus } from '@/features/tasks/useTasks';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { formatDate } from '@/lib/utils';

export function TasksPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'kanban' ? 'kanban' : 'table';
  const status = params.get('status') ?? undefined;
  const priority = params.get('priority') ?? undefined;
  const eventId = params.get('eventId') ?? undefined;

  const { data, isLoading } = useTasksQuery({ status, priority, eventId, pageSize: 200, sortBy: 'deadline' });
  const setStatus = useSetTaskStatus();

  function setFilter(key: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Across every event, organized your way.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" className="gap-1.5" onClick={() => setFilter('view', 'table')}>
            <TableIcon className="h-3.5 w-3.5" /> Table
          </Button>
          <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" className="gap-1.5" onClick={() => setFilter('view', 'kanban')}>
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={status ?? 'all'} onValueChange={(v) => setFilter('status', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority ?? 'all'} onValueChange={(v) => setFilter('priority', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data?.data.length ? (
        <EmptyState title="No tasks found" description="Tasks are created from within an event's Tasks tab." />
      ) : view === 'kanban' ? (
        <KanbanBoard tasks={data.data} onStatusChange={(id, s) => setStatus.mutate({ id, status: s })} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Deadline</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.data.map((task) => (
                <tr key={task.id} className="hover:bg-muted/40">
                  <td className="p-3">
                    <Link to={`/events/${task.eventId}`} className="font-medium hover:underline">
                      {task.title}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(task.deadline)}</td>
                  <td className="p-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="p-3">
                    <StatusBadge status={task.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
