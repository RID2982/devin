import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventQuery, useDeleteEvent, useUpdateEvent } from '@/features/events/useEvents';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { EVENT_STATUSES } from '@app/shared';
import { OverviewTab } from './tabs/OverviewTab';
import { TasksTab } from './tabs/TasksTab';
import { NotesTab } from './tabs/NotesTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { TimelineTab } from './tabs/TimelineTab';
import { PeopleTab } from './tabs/PeopleTab';
import { BudgetTab } from './tabs/BudgetTab';

const TABS = ['overview', 'tasks', 'notes', 'documents', 'people', 'budget', 'timeline'] as const;

export function EventDetailPage() {
  const { id, tab = 'overview' } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEventQuery(id);
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent(id ?? '');

  if (isLoading || !event) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const activeTab = TABS.includes(tab as (typeof TABS)[number]) ? tab : 'overview';

  const handleDelete = () => {
    if (confirm(`Are you sure you want to permanently delete "${event.name}"? This will remove all associated tasks, checklist items, and documents.`)) {
      deleteEvent.mutate(event.id, {
        onSuccess: () => navigate('/events'),
      });
    }
  };

  const handleStatusChange = (status: string) => {
    updateEvent.mutate({ status });
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/events')} className="gap-1.5 px-2">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Button>

      <div className="w-full space-y-4">
        {/* Left Area: Event Workspace Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 w-full border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: event.color ?? '#b42244' }} />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{event.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {event.category ? `${event.category} · ` : ''}
                  {formatDate(event.date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status:</span>
                <Select value={event.status} onValueChange={handleStatusChange} disabled={updateEvent.isPending}>
                  <SelectTrigger className="w-36 h-9 rounded-xl font-bold border-border/80 bg-card text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status} className="font-semibold text-xs">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-1 h-9 rounded-xl text-xs font-semibold px-3"
              >
                <Trash2 className="h-4 w-4" /> Delete Event
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => navigate(`/events/${id}/${v}`, { replace: true })}>
            <TabsList className="flex-wrap bg-muted/65 p-1 rounded-xl">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-lg">Tasks & Checklist</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-lg">Notes</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-lg">Documents</TabsTrigger>
              <TabsTrigger value="people" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-lg">People</TabsTrigger>
              <TabsTrigger value="budget" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-lg">Budget</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-lg">Timeline & Activity</TabsTrigger>
            </TabsList>

            <div className="mt-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm min-h-[350px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12, ease: 'easeInOut' }}
                >
                  {activeTab === 'overview' && <OverviewTab event={event} />}
                  {activeTab === 'tasks' && <TasksTab eventId={event.id} />}
                  {activeTab === 'notes' && <NotesTab eventId={event.id} />}
                  {activeTab === 'documents' && <DocumentsTab eventId={event.id} />}
                  {activeTab === 'people' && <PeopleTab eventId={event.id} />}
                  {activeTab === 'budget' && <BudgetTab event={event} />}
                  {activeTab === 'timeline' && <TimelineTab eventId={event.id} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
