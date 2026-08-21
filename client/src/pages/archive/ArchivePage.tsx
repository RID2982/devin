import { useState, type ReactNode } from 'react';
import { AlertCircle, Archive, CalendarDays, CheckSquare, Undo2, Users } from 'lucide-react';
import { useEventsQuery, useRestoreEvent } from '@/features/events/useEvents';
import { useTasksQuery, useRestoreTask } from '@/features/tasks/useTasks';
import { usePeopleQuery, useRestorePerson } from '@/features/people/usePeople';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/utils';

// The API caps pageSize at 100 (server/src/lib/listQuery.ts). Rather than
// pretend that's the whole list, each section compares it against the reported
// total and says so when there is more.
const PAGE_SIZE = 100;

interface ArchiveRow {
  id: string;
  title: string;
  subtitle: string;
}

function ArchiveSection({
  rows,
  total,
  isLoading,
  isError,
  emptyTitle,
  emptyDescription,
  onRestore,
  isRestoring,
  restoreError,
  icon,
}: {
  rows: ArchiveRow[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRestore: (id: string) => void;
  isRestoring: boolean;
  restoreError: string | null;
  icon: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 py-1">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  // A failed request is not an empty archive. Saying "nothing archived" here
  // would be a confident wrong answer, so failure gets its own state.
  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-5 w-5 text-destructive" />}
        title="Couldn't load the archive"
        description="The request to the server failed. Check that the API is running, then reload the page."
      />
    );
  }

  if (!rows.length) {
    return <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      {restoreError && (
        <p className="mb-3 flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {restoreError}
        </p>
      )}

      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{row.title}</p>
              <p className="text-xs text-muted-foreground">{row.subtitle}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={isRestoring}
              onClick={() => onRestore(row.id)}
            >
              <Undo2 className="h-3.5 w-3.5" />
              {isRestoring ? 'Restoring…' : 'Restore'}
            </Button>
          </div>
        ))}
      </div>

      {total > rows.length && (
        <p className="pt-3 text-xs text-muted-foreground">
          Showing the first {rows.length} of {total}. Restore some to see the rest.
        </p>
      )}
    </div>
  );
}

export function ArchivePage() {
  const [error, setError] = useState<string | null>(null);

  const events = useEventsQuery({ archived: true, pageSize: PAGE_SIZE, sortBy: 'date', sortDir: 'desc' });
  const tasks = useTasksQuery({ archived: true, pageSize: PAGE_SIZE });
  const people = usePeopleQuery({ archived: true, pageSize: PAGE_SIZE });

  const restoreEvent = useRestoreEvent();
  const restoreTask = useRestoreTask();
  const restorePerson = useRestorePerson();

  /** Restores never reported failure before — a dead button was the only signal. */
  const restore = (mutation: { mutate: (id: string, opts: object) => void }, label: string) => (id: string) => {
    setError(null);
    mutation.mutate(id, {
      onError: (err: unknown) =>
        setError(err instanceof Error ? err.message : `Couldn't restore that ${label}. Try again.`),
    });
  };

  const eventCount = events.data?.meta.total ?? 0;
  const taskCount = tasks.data?.meta.total ?? 0;
  const personCount = people.data?.meta.total ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Archived items are hidden from your lists but never deleted. Restore anything from here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archived items</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="events">
            <TabsList className="mb-4">
              <TabsTrigger value="events">Events{eventCount ? ` (${eventCount})` : ''}</TabsTrigger>
              <TabsTrigger value="tasks">Tasks{taskCount ? ` (${taskCount})` : ''}</TabsTrigger>
              <TabsTrigger value="people">People{personCount ? ` (${personCount})` : ''}</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              <ArchiveSection
                rows={(events.data?.data ?? []).map((e) => ({
                  id: e.id,
                  title: e.name,
                  subtitle: `${formatDate(e.date)} · archived ${formatDate(e.archivedAt)}`,
                }))}
                total={eventCount}
                isLoading={events.isLoading}
                isError={events.isError}
                emptyTitle="No archived events"
                emptyDescription="Events you archive from the event page will appear here."
                onRestore={restore(restoreEvent, 'event')}
                isRestoring={restoreEvent.isPending}
                restoreError={error}
                icon={<CalendarDays className="h-5 w-5" />}
              />
            </TabsContent>

            <TabsContent value="tasks">
              <ArchiveSection
                rows={(tasks.data?.data ?? []).map((t) => ({
                  id: t.id,
                  title: t.title,
                  subtitle: `${t.status} · archived ${formatDate(t.archivedAt)}`,
                }))}
                total={taskCount}
                isLoading={tasks.isLoading}
                isError={tasks.isError}
                emptyTitle="No archived tasks"
                emptyDescription="Tasks you archive from an event's Tasks tab will appear here."
                onRestore={restore(restoreTask, 'task')}
                isRestoring={restoreTask.isPending}
                restoreError={error}
                icon={<CheckSquare className="h-5 w-5" />}
              />
            </TabsContent>

            <TabsContent value="people">
              <ArchiveSection
                rows={(people.data?.data ?? []).map((p) => ({
                  id: p.id,
                  title: p.name,
                  subtitle: [p.role, p.email].filter(Boolean).join(' · ') || 'No role recorded',
                }))}
                total={personCount}
                isLoading={people.isLoading}
                isError={people.isError}
                emptyTitle="No archived people"
                emptyDescription="People you archive from the directory will appear here."
                onRestore={restore(restorePerson, 'person')}
                isRestoring={restorePerson.isPending}
                restoreError={error}
                icon={<Users className="h-5 w-5" />}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Archive className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Notes are the one exception: deleting a note removes it from its event for good, because the
        API has no endpoint to bring one back.
      </p>
    </div>
  );
}
