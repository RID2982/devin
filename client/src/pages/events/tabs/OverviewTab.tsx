import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEventSummaryQuery } from '@/features/events/useEvents';
import type { EventRecord } from '@/features/events/useEvents';
import { formatDate } from '@/lib/utils';

interface Summary {
  checklist: { total: number; done: number };
  tasks: { total: number; done: number };
  completionPercent: number;
}

export function OverviewTab({ event }: { event: EventRecord }) {
  const { data: summary } = useEventSummaryQuery(event.id) as { data: Summary | undefined };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.description || 'No description yet.'}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Checklist</span>
                <span>{summary ? `${summary.checklist.done}/${summary.checklist.total}` : '—'}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${summary?.completionPercent ?? 0}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tasks completed</span>
              <span>{summary ? `${summary.tasks.done}/${summary.tasks.total}` : '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Venue</span>
              <span>{event.venue || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budget</span>
              <span>{event.budget ? `₹${event.budget}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span>{event.category || '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
