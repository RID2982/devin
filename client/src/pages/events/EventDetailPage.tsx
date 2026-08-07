import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, MapPin, Award, Layers, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventQuery, useDeleteEvent, useUpdateEvent } from '@/features/events/useEvents';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Area: Event Workspace Tabs */}
        <div className="lg:col-span-2 space-y-4">
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

        {/* Right Area: Sticky Detail Card (Xelio Request Page Style) */}
        <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-md bg-card/95 backdrop-blur overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Event Management</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Interactive Status Selector Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Transition Status</label>
                <div className="flex items-center gap-3">
                  <Select value={event.status} onValueChange={handleStatusChange} disabled={updateEvent.isPending}>
                    <SelectTrigger className="w-full h-10 rounded-xl font-medium border-border/80 hover:bg-muted/40 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="font-medium">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Event Attributes Details Grid */}
              <div className="space-y-3.5 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Event Date
                  </span>
                  <span className="font-bold text-foreground">{formatDate(event.date)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Venue
                  </span>
                  <span className="font-bold text-foreground truncate max-w-[150px]" title={event.venue ?? '—'}>
                    {event.venue ?? '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <Layers className="h-3.5 w-3.5 text-primary" /> Category
                  </span>
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary text-[10px] uppercase">
                    {event.category ?? 'General'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <Award className="h-3.5 w-3.5 text-primary" /> Priority
                  </span>
                  <PriorityBadge priority={event.priority} />
                </div>
              </div>

              {/* Description preview */}
              {event.description && (
                <div className="border-t border-border/40 pt-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <FileText className="h-3 w-3 text-primary" /> Description
                  </label>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/40">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Delete event button inside card */}
              <div className="border-t border-border/40 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-1.5 py-2.5 h-10 rounded-xl text-xs font-semibold"
                >
                  <Trash2 className="h-4 w-4" /> Delete Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
