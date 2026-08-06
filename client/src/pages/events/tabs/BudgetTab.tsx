import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUpdateEvent, type EventRecord } from '@/features/events/useEvents';

export function BudgetTab({ event }: { event: EventRecord }) {
  const [budget, setBudget] = useState(event.budget ?? '');
  const updateEvent = useUpdateEvent(event.id);

  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="budget">Allocated budget (₹)</Label>
          <Input id="budget" type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <Button
          size="sm"
          disabled={updateEvent.isPending}
          onClick={() => updateEvent.mutate({ budget: budget === '' ? undefined : Number(budget) })}
        >
          {updateEvent.isPending ? 'Saving…' : 'Save Budget'}
        </Button>
      </CardContent>
    </Card>
  );
}
