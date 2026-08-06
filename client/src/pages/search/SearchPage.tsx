import { useSearchParams, Link } from 'react-router-dom';
import { useSearchQuery } from '@/features/search/useSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/utils';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const { data, isLoading } = useSearchQuery(q);

  const total = (data?.events.length ?? 0) + (data?.tasks.length ?? 0) + (data?.people.length ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search results for "{q}"</h1>
        {!isLoading && <p className="text-sm text-muted-foreground">{total} result{total === 1 ? '' : 's'}</p>}
      </div>

      {!isLoading && total === 0 && <EmptyState title="No matches found" />}

      {(data?.events.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data!.events.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <span>{e.name}</span>
                <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {(data?.tasks.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data!.tasks.map((t) => (
              <Link key={t.id} to={`/events/${t.eventId}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <span>{t.title}</span>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {(data?.people.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data!.people.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.role}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
