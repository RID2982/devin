import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MonthlyReport {
  month: string;
  events: Array<{ id: string; name: string; status: string }>;
  totals: { events: number; tasks: number; completedTasks: number; pendingTasks: number };
}

interface ProductivityReport {
  byPerson: Array<{ personId: string; personName: string; completed: number }>;
}

export function ReportsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const { data: monthly } = useQuery({
    queryKey: ['reports', 'monthly', month],
    queryFn: () => apiClient.get<MonthlyReport>(`/reports/monthly?month=${month}`),
  });

  const { data: productivity } = useQuery({
    queryKey: ['reports', 'productivity'],
    queryFn: () => apiClient.get<ProductivityReport>('/reports/productivity'),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">On-screen summaries. Export to PDF/Excel/CSV is on the roadmap.</p>
      </div>

      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="month">Month</Label>
        <Input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary — {month}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">Events</p>
                <p className="text-xl font-semibold">{monthly?.totals.events ?? '—'}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">Tasks</p>
                <p className="text-xl font-semibold">{monthly?.totals.tasks ?? '—'}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">Completed</p>
                <p className="text-xl font-semibold">{monthly?.totals.completedTasks ?? '—'}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold">{monthly?.totals.pendingTasks ?? '—'}</p>
              </div>
            </div>
            <ul className="space-y-1 text-sm">
              {monthly?.events.map((e) => (
                <li key={e.id} className="flex justify-between">
                  <span>{e.name}</span>
                  <span className="text-muted-foreground">{e.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Person Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {productivity?.byPerson.length ? (
              productivity.byPerson
                .sort((a, b) => b.completed - a.completed)
                .map((p) => (
                  <div key={p.personId} className="flex items-center justify-between text-sm">
                    <span>{p.personName}</span>
                    <span className="font-medium">{p.completed} completed</span>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">No completed tasks with assignees yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
