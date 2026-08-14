import { useSearchParams } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { useEventsQuery } from '@/features/events/useEvents';
import { useAttendanceQuery, useMarkAttendance } from '@/features/attendance/useAttendance';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') ?? undefined;

  const { data: events } = useEventsQuery({ pageSize: 100, sortBy: 'date', sortDir: 'desc' });
  const { data: roster, isLoading } = useAttendanceQuery(eventId);
  const markAttendance = useMarkAttendance(eventId ?? '');

  function selectEvent(id: string) {
    setSearchParams(id ? { eventId: id } : {});
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">Mark who showed up to each event.</p>
        </div>
      </div>

      <div className="max-w-xs">
        <Select value={eventId} onValueChange={selectEvent}>
          <SelectTrigger>
            <SelectValue placeholder="Select an event…" />
          </SelectTrigger>
          <SelectContent>
            {events?.data.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!eventId ? (
        <EmptyState icon={<CalendarCheck className="h-8 w-8" />} title="Pick an event" description="Choose an event above to view and mark attendance for everyone assigned to it." />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !roster?.length ? (
        <EmptyState title="No one assigned yet" description="Add people to this event from its People tab before marking attendance." />
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {roster.map((row) => (
            <div key={row.personId} className="flex items-center gap-3 p-3">
              <Avatar>
                <AvatarFallback>{row.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.roleOnEvent || '—'}</p>
              </div>
              <span className={`text-xs font-medium ${row.status === 'Present' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {row.status === 'Present' ? 'Present' : 'Absent'}
              </span>
              <Switch
                checked={row.status === 'Present'}
                onCheckedChange={(checked) =>
                  markAttendance.mutate({ personId: row.personId, status: checked ? 'Present' : 'Absent' })
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
