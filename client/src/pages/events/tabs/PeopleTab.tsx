import { UserMinus } from 'lucide-react';
import { useEventQuery, useAddEventPerson, useRemoveEventPerson } from '@/features/events/useEvents';
import { usePeopleQuery } from '@/features/people/usePeople';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';

export function PeopleTab({ eventId }: { eventId: string }) {
  const { data: event } = useEventQuery(eventId);
  const { data: people } = usePeopleQuery({ pageSize: 100 });
  const addPerson = useAddEventPerson(eventId);
  const removePerson = useRemoveEventPerson(eventId);

  const assigned = event?.eventPeople ?? [];
  const assignedIds = new Set(assigned.map((a) => a.personId));
  const available = people?.data.filter((p) => !assignedIds.has(p.id)) ?? [];

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select onValueChange={(personId) => addPerson.mutate(personId)}>
          <SelectTrigger>
            <SelectValue placeholder="Add a person to this event…" />
          </SelectTrigger>
          <SelectContent>
            {available.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} {p.role ? `· ${p.role}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {assigned.length === 0 ? (
        <EmptyState title="No one assigned yet" />
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {assigned.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <Avatar>
                <AvatarFallback>{a.person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.person.name}</p>
                <p className="text-xs text-muted-foreground">{a.roleOnEvent || a.person.role || '—'}</p>
              </div>
              <button onClick={() => removePerson.mutate(a.personId)} className="text-muted-foreground hover:text-destructive">
                <UserMinus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
