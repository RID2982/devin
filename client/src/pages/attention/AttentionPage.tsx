import { Link } from 'react-router-dom';
import { AlertTriangle, Flame, Hourglass, UserX, ListX, FileWarning, IndianRupee } from 'lucide-react';
import { useAttentionQuery } from '@/features/attention/useAttention';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { formatDate } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

function Section({
  title,
  icon: Icon,
  items,
  renderItem,
}: {
  title: string;
  icon: LucideIcon;
  items: unknown[];
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4" /> {title}
          <span className="ml-auto text-xs font-normal text-muted-foreground">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.length === 0 ? <EmptyState title="All clear" className="py-6" /> : items.map(renderItem)}
      </CardContent>
    </Card>
  );
}

export function AttentionPage() {
  const { data, isLoading } = useAttentionQuery();

  if (isLoading || !data) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attention Center</h1>
        <p className="text-sm text-muted-foreground">Everything that needs your eyes right now.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section
          title="Overdue Tasks"
          icon={AlertTriangle}
          items={data.overdueTasks}
          renderItem={(t) => (
            <Link key={t.id} to={`/events/${t.eventId}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="truncate">{t.title}</span>
              <span className="text-xs text-destructive">{formatDate(t.deadline)}</span>
            </Link>
          )}
        />
        <Section
          title="High Priority"
          icon={Flame}
          items={data.highPriorityTasks}
          renderItem={(t) => (
            <Link key={t.id} to={`/events/${t.eventId}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="truncate">{t.title}</span>
              <PriorityBadge priority={t.priority} />
            </Link>
          )}
        />
        <Section
          title="Upcoming Deadlines (7 days)"
          icon={Hourglass}
          items={data.upcomingDeadlines}
          renderItem={(t) => (
            <Link key={t.id} to={`/events/${t.eventId}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="truncate">{t.title}</span>
              <span className="text-xs text-muted-foreground">{formatDate(t.deadline)}</span>
            </Link>
          )}
        />
        <Section
          title="Unassigned Tasks"
          icon={UserX}
          items={data.unassignedTasks}
          renderItem={(t) => (
            <Link key={t.id} to={`/events/${t.eventId}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="truncate">{t.title}</span>
            </Link>
          )}
        />
        <Section
          title="Incomplete Checklists"
          icon={ListX}
          items={data.incompleteChecklists}
          renderItem={(e) => (
            <Link key={e.id} to={`/events/${e.id}/checklist`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="truncate">{e.name}</span>
            </Link>
          )}
        />
        <Section
          title="Missing Documents"
          icon={FileWarning}
          items={data.missingDocuments}
          renderItem={(e) => (
            <Link key={e.id} to={`/events/${e.id}/documents`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="truncate">{e.name}</span>
            </Link>
          )}
        />
        <Section
          title="Budget Pending"
          icon={IndianRupee}
          items={data.budgetPending}
          renderItem={(e) => (
            <Link key={e.id} to={`/events/${e.id}/budget`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="truncate">{e.name}</span>
            </Link>
          )}
        />
      </div>
    </div>
  );
}
