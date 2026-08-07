import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEventSummaryQuery } from '@/features/events/useEvents';
import type { EventRecord } from '@/features/events/useEvents';
import { formatDate } from '@/lib/utils';
import { Wallet, Calendar, MapPin, Layers, Award, FileText } from 'lucide-react';
import { PriorityBadge } from '@/components/shared/PriorityBadge';

interface Summary {
  checklist: { total: number; done: number };
  tasks: { total: number; done: number };
  completionPercent: number;
}

export function OverviewTab({ event }: { event: EventRecord }) {
  const { data: summary } = useEventSummaryQuery(event.id) as { data: Summary | undefined };

  // Calculate budget stats
  const expenses = event.expenses ?? [];
  const totalAllocated = Number(event.budget ?? 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const remainingBudget = totalAllocated - totalExpenses;
  const percentSpent = totalAllocated > 0 ? Math.min(100, Math.round((totalExpenses / totalAllocated) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Section: Prominent Budget Analytics Overview Card */}
      <Card className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 shadow-md overflow-hidden">
        <div className="p-4 md:p-5 border-b border-border/40 bg-muted/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Event Budget Overview</h3>
          </div>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
            ₹{totalAllocated.toLocaleString('en-IN')} Limit
          </span>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* Real-time stats display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Allocated Pool</span>
              <p className="text-xl font-extrabold text-foreground">₹{totalAllocated.toLocaleString('en-IN')}</p>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/40 pt-3 md:pt-0 md:pl-5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Spent To Date</span>
              <p className="text-xl font-extrabold text-destructive">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/40 pt-3 md:pt-0 md:pl-5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Available Balance</span>
              <p className={`text-xl font-extrabold ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                ₹{remainingBudget.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Graphical Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
              <span>Budget Exhaustion</span>
              <span>{percentSpent}% Consumed</span>
            </div>
            <div className="h-2 w-full bg-muted/65 overflow-hidden rounded-full border border-border/30">
              <div
                className={`h-full rounded-full transition-all duration-300 ${percentSpent > 90 ? 'bg-destructive' : 'brand-gradient'}`}
                style={{ width: `${percentSpent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Description (takes 2 columns) */}
        <div className="md:col-span-2 space-y-4">
          <Card className="rounded-2xl border border-border/80 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center gap-2 border-b border-border/35">
              <FileText className="h-4.5 w-4.5 text-primary" />
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider m-0">Event Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">
                {event.description || 'No description provided for this event.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Workspace details boxes & Checklist progress */}
        <div className="md:col-span-1 space-y-4">
          {/* Progress Overview box */}
          <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-3.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">Workspace Progress</h4>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>Checklist Done</span>
                  <span>{summary ? `${summary.checklist.done}/${summary.checklist.total}` : '—'}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${summary?.completionPercent ?? 0}%` }} />
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase pt-1 border-t border-border/30">
                <span>Tasks Completed</span>
                <span className="text-foreground font-bold">{summary ? `${summary.tasks.done}/${summary.tasks.total}` : '—'}</span>
              </div>
            </div>
          </Card>

          {/* Details Box Grid */}
          <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-3.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">Event Attributes</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/30">
                <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Event Date
                </span>
                <span className="font-bold text-foreground">{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/30">
                <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Venue
                </span>
                <span className="font-bold text-foreground truncate max-w-[150px]" title={event.venue ?? '—'}>
                  {event.venue ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/30">
                <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Category
                </span>
                <span className="font-bold text-foreground">{event.category || 'General'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1.5">
                <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Award className="h-3.5 w-3.5 text-primary" /> Priority
                </span>
                <PriorityBadge priority={event.priority} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
