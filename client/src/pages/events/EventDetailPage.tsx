import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEventQuery } from '@/features/events/useEvents';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { OverviewTab } from './tabs/OverviewTab';
import { TasksTab } from './tabs/TasksTab';
import { ChecklistTab } from './tabs/ChecklistTab';
import { NotesTab } from './tabs/NotesTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { TimelineTab } from './tabs/TimelineTab';
import { PeopleTab } from './tabs/PeopleTab';
import { BudgetTab } from './tabs/BudgetTab';

const TABS = ['overview', 'tasks', 'checklist', 'notes', 'documents', 'people', 'budget', 'timeline'] as const;

export function EventDetailPage() {
  const { id, tab = 'overview' } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEventQuery(id);

  if (isLoading || !event) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const activeTab = TABS.includes(tab as (typeof TABS)[number]) ? tab : 'overview';

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/events')} className="gap-1.5 px-2">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: event.color ?? '#b42244' }} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
            <p className="text-sm text-muted-foreground">
              {event.category ? `${event.category} · ` : ''}
              {formatDate(event.date)}
              {event.venue ? ` · ${event.venue}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={event.priority} />
          <StatusBadge status={event.status} kind="event" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => navigate(`/events/${id}/${v}`, { replace: true })}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="timeline">Timeline & Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab event={event} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="checklist">
          <ChecklistTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="people">
          <PeopleTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetTab event={event} />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab eventId={event.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
