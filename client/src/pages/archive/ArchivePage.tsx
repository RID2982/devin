import { Undo2 } from 'lucide-react';
import { useEventsQuery, useRestoreEvent } from '@/features/events/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/utils';

export function ArchivePage() {
  const { data, isLoading } = useEventsQuery({ archived: true, pageSize: 100 });
  const restoreEvent = useRestoreEvent();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">Nothing is ever permanently deleted — restore any archived event anytime.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archived Events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? null : !data?.data.length ? (
            <EmptyState title="Nothing archived" />
          ) : (
            <div className="divide-y divide-border">
              {data.data.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => restoreEvent.mutate(e.id)}>
                    <Undo2 className="h-3.5 w-3.5" /> Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
