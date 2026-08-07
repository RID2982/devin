import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as swk, endOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { PartyPopper, CheckSquare, Calendar as CalendarIcon, MapPin, ArrowRight } from 'lucide-react';
import { useCalendarQuery, type CalendarItem } from '@/features/calendar/useCalendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { formatDate } from '@/lib/utils';
import '@/styles/calendar-overrides.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarItem;
}

export function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [filterType, setFilterType] = useState<'all' | 'event' | 'task'>('all');
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const navigate = useNavigate();

  const range = useMemo(() => ({ from: swk(startOfMonth(date)), to: endOfWeek(endOfMonth(date)) }), [date]);
  const { data, isLoading } = useCalendarQuery(range.from, range.to);

  const events: CalEvent[] = useMemo(() => {
    const rawItems: CalendarItem[] = [...(data?.events ?? []), ...(data?.tasks ?? [])];
    const items = filterType === 'all' ? rawItems : rawItems.filter((i) => i.type === filterType);

    return items
      .filter((i) => i.date)
      .map((i) => {
        const startDate = new Date(i.date as string);
        return {
          id: `${i.type}-${i.id}`,
          title: i.type === 'event' ? i.title : `✓ ${i.title}`,
          start: startDate,
          end: startDate,
          resource: i,
        };
      });
  }, [data, filterType]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Interactive Calendar</h1>
          <p className="text-sm text-muted-foreground">View all Rotaract Club events and task deadlines without crowding.</p>
        </div>

        {/* Quick Type Filter Chips */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 text-xs shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              filterType === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Items ({events.length})
          </button>
          <button
            onClick={() => setFilterType('event')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold transition-all ${
              filterType === 'event' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PartyPopper className="h-3.5 w-3.5" /> Events
          </button>
          <button
            onClick={() => setFilterType('task')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold transition-all ${
              filterType === 'task' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" /> Tasks
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-md backdrop-blur-md" style={{ minHeight: 680 }}>
        {!isLoading && (
          <Calendar
            localizer={localizer}
            events={events}
            date={date}
            view={view}
            onNavigate={setDate}
            onView={setView}
            views={['month', 'week', 'day', 'agenda']}
            step={30}
            timeslots={2}
            selectable
            onSelectSlot={(slotInfo) => {
              setDate(slotInfo.start);
              if (view === 'month') {
                setView('day');
              }
            }}
            style={{ height: 640 }}
            onSelectEvent={(e) => setSelected(e.resource)}
            eventPropGetter={(e) => ({
              style: {
                backgroundColor: e.resource.type === 'event' ? e.resource.color ?? '#b42244' : '#64748b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: '600',
              },
            })}
          />
        )}
      </div>

      {/* Selected Item Detail Dialog */}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary uppercase">
                    {selected.type}
                  </span>
                  {(selected as any).category && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {(selected as any).category}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-lg font-bold">{selected.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 py-2 text-sm text-foreground">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span>{formatDate(selected.date)}</span>
                </div>

                {selected.type === 'event' && selected.venue && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{selected.venue}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <PriorityBadge priority={selected.priority} />
                  <StatusBadge status={selected.status} kind={selected.type === 'event' ? 'event' : 'task'} />
                </div>
              </div>

              <DialogFooter>
                <Button
                  className="brand-gradient text-white border-0 w-full gap-2"
                  onClick={() => navigate(selected.type === 'event' ? `/events/${selected.id}` : `/events/${selected.eventId}`)}
                >
                  Open Event Workspace <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
