import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { PRIORITIES, EVENT_STATUSES } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { formatDate } from '@/lib/utils';
import { useEventsQuery } from '@/features/events/useEvents';
import { CreateEventDialog } from '@/features/events/CreateEventDialog';

export function EventsListPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const createOpen = params.get('create') === '1';

  const status = params.get('status') ?? undefined;
  const priority = params.get('priority') ?? undefined;

  const { data, isLoading } = useEventsQuery({ search: search || undefined, status, priority, pageSize: 50 });

  function setCreateOpen(open: boolean) {
    const next = new URLSearchParams(params);
    if (open) next.set('create', '1');
    else next.delete('create');
    setParams(next, { replace: true });
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">All club events, organized and searchable.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={status ?? 'all'} onValueChange={(v) => setFilter('status', v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {EVENT_STATUSES.map((s) => (
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <EmptyState title="No events found" description="Create your first event to get started." action={<Button onClick={() => setCreateOpen(true)}>New Event</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((event) => (
            <motion.div key={event.id} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <Link to={`/events/${event.id}`}>
                <Card className="h-full overflow-hidden rounded-2xl transition-shadow hover:shadow-lg">
                  <div className="flex">
                    <div className="w-1.5 shrink-0" style={{ backgroundColor: event.color ?? '#b42244' }} />
                    <CardContent className="min-w-0 flex-1 space-y-2.5 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{event.name}</h3>
                        <PriorityBadge priority={event.priority} />
                      </div>
                      {event.category && <p className="text-xs text-muted-foreground">{event.category}</p>}
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.date)} {event.venue ? `· ${event.venue}` : ''}
                      </p>
                      <StatusBadge status={event.status} kind="event" />
                    </CardContent>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
