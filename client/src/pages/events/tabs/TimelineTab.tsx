import { useState } from 'react';
import { MessageSquare, Send, PlusCircle, Trash2, RotateCcw, CheckCircle2, Activity, GitCommit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventQuery, useEventTimelineQuery } from '@/features/events/useEvents';
import { useCommentsQuery, useCreateComment } from '@/features/comments/useComments';
import { useTasksQuery } from '@/features/tasks/useTasks';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ActivityRow {
  id: string;
  summary: string;
  createdAt: string;
}

export function TimelineTab({ eventId }: { eventId: string }) {
  const { data: event } = useEventQuery(eventId);
  const { data: tasksData } = useTasksQuery({ eventId, pageSize: 100 });
  const { data: activity } = useEventTimelineQuery(eventId) as { data: ActivityRow[] | undefined };
  const { data: comments } = useCommentsQuery(eventId);
  const createComment = useCreateComment(eventId);
  const [body, setBody] = useState('');

  function submitComment() {
    if (!body.trim()) return;
    createComment.mutate(body.trim());
    setBody('');
  }

  // Generate 15-day range centered around the event date
  const baseDate = event?.date ? new Date(event.date) : new Date();
  const days: Date[] = [];
  const startOffset = -4; // Show 4 days before, 10 days after
  for (let i = startOffset; i < startOffset + 15; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayIndex = days.findIndex(d => d.toISOString().slice(0, 10) === todayStr);

  const getSpan = (task: any) => {
    const startStr = task.createdAt ? task.createdAt.slice(0, 10) : baseDate.toISOString().slice(0, 10);
    const endStr = task.deadline ? task.deadline.slice(0, 10) : startStr;

    const start = new Date(startStr);
    const end = new Date(endStr);

    const windowStart = new Date(days[0].toISOString().slice(0, 10));
    const windowEnd = new Date(days[14].toISOString().slice(0, 10));

    const diffMsStart = start.getTime() - windowStart.getTime();
    const diffDaysStart = Math.round(diffMsStart / (1000 * 60 * 60 * 24));

    const diffMsEnd = end.getTime() - windowStart.getTime();
    const diffDaysEnd = Math.round(diffMsEnd / (1000 * 60 * 60 * 24));

    const startIndex = Math.max(0, Math.min(14, diffDaysStart));
    const endIndex = Math.max(0, Math.min(14, diffDaysEnd));

    const isOutOfBounds = (start > windowEnd) || (end < windowStart);

    return {
      startCol: startIndex + 2, // 1-indexed header offset (+2)
      colSpan: Math.max(1, endIndex - startIndex + 1),
      isOutOfBounds,
    };
  };

  const feed = [
    ...(activity ?? []).map((a) => ({ id: `a-${a.id}`, type: 'activity' as const, text: a.summary, at: a.createdAt })),
    ...(comments ?? []).map((c) => ({ id: `c-${c.id}`, type: 'comment' as const, text: c.body, at: c.createdAt })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const getNodeDetails = (item: typeof feed[number]) => {
    if (item.type === 'comment') {
      return {
        icon: MessageSquare,
        colorClass: 'text-primary bg-primary/10 border-primary/25',
        title: 'Member Comment',
      };
    }

    const text = item.text.toLowerCase();
    if (text.includes('created')) {
      return {
        icon: PlusCircle,
        colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/25',
        title: 'Event Created',
      };
    }
    if (text.includes('archived') || text.includes('deleted')) {
      return {
        icon: Trash2,
        colorClass: 'text-destructive bg-destructive/10 border-destructive/25',
        title: 'Event Archived',
      };
    }
    if (text.includes('restored')) {
      return {
        icon: RotateCcw,
        colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/25',
        title: 'Event Restored',
      };
    }
    if (text.includes('status') || text.includes('completed')) {
      return {
        icon: CheckCircle2,
        colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25',
        title: 'Status Transition',
      };
    }

    return {
      icon: Activity,
      colorClass: 'text-muted-foreground bg-muted border-border',
      title: 'Activity Log',
    };
  };

  const tasks = tasksData?.data ?? [];

  return (
    <div className="space-y-8">
      {/* 📅 Premium Gantt Roadmap Scheduler */}
      <Card className="rounded-2xl border border-border/80 shadow-md overflow-hidden bg-card/60 backdrop-blur-sm">
        <div className="p-4 border-b border-border/40 bg-muted/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4.5 w-4.5 text-primary rotate-90" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Event Roadmap & Timeline</h3>
          </div>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
            Gantt Calendar
          </span>
        </div>

        <CardContent className="p-5 overflow-x-auto">
          <div className="min-w-[800px] relative space-y-4">
            
            {/* Background Grid Lines */}
            <div className="absolute inset-0 pointer-events-none" style={{ display: 'grid', gridTemplateColumns: '180px repeat(15, minmax(0, 1fr))' }}>
              <div className="border-r border-border/30" />
              {days.map((_, index) => (
                <div key={index} className="border-r border-border/20 h-full last:border-0" />
              ))}
            </div>

            {/* Today Line Indicator */}
            {todayIndex !== -1 && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-primary/40 z-20 pointer-events-none"
                style={{
                  gridColumnStart: todayIndex + 2,
                  marginLeft: '50%'
                }}
              >
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background shadow" />
              </div>
            )}

            {/* Timeline Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(15, minmax(0, 1fr))' }} className="border-b border-border/40 pb-3 mb-2 text-center z-10 relative">
              <div className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Event Tasks</div>
              {days.map((day, i) => {
                const isToday = day.toISOString().slice(0, 10) === todayStr;
                const isEventDay = event?.date && day.toISOString().slice(0, 10) === event.date.slice(0, 10);
                return (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      {day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                    </span>
                    <span className={`text-[11px] font-extrabold mt-0.5 w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : isEventDay
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-foreground'
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Task Horizontal Bars */}
            <div className="space-y-3 z-10 relative py-1">
              {tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No roadmap data available. Add tasks to see them scheduled.
                </div>
              ) : (
                tasks.map((task) => {
                  const span = getSpan(task);
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px repeat(15, minmax(0, 1fr))',
                        alignItems: 'center'
                      }}
                      className="group"
                    >
                      {/* Task Info Label */}
                      <div className="text-xs font-bold truncate pr-3 text-foreground/90 group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500'
                            : task.priority === 'High'
                              ? 'bg-rose-500'
                              : task.priority === 'Medium'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                        }`} />
                        <span className="truncate">{task.title}</span>
                      </div>

                      {/* Gantt Bar Pill */}
                      {!span.isOutOfBounds && (
                        <div
                          className={`h-6.5 rounded-full flex items-center px-3 text-[10px] font-extrabold shadow-sm select-none truncate transition-all duration-200 hover:brightness-105 ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500 text-white'
                              : task.priority === 'High'
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                                : task.priority === 'Medium'
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                          }`}
                          style={{
                            gridColumnStart: span.startCol,
                            gridColumnEnd: `span ${span.colSpan}`
                          }}
                          title={`${task.title} (${task.status})`}
                        >
                          <span className="truncate">{task.title}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Activities & Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Activity Logs Feed */}
        <div className="lg:col-span-2 space-y-5">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activity Feed & History</h4>
          {feed.length === 0 ? (
            <EmptyState title="Nothing here yet" />
          ) : (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-[17px] top-2.5 bottom-2.5 w-[2px] bg-gradient-to-b from-primary/70 via-muted to-border/30" />

              <AnimatePresence initial={false}>
                {feed.map((item) => {
                  const node = getNodeDetails(item);
                  const NodeIcon = node.icon;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="relative flex gap-4 group"
                    >
                      <div className={`absolute -left-[24px] top-1.5 z-10 flex h-8.5 w-8.5 items-center justify-center rounded-xl border shadow-sm transition-all group-hover:scale-105 ${node.colorClass}`}>
                        <NodeIcon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 bg-card/65 p-3.5 rounded-2xl border border-border/70 group-hover:border-primary/45 transition-all shadow-sm space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">{node.title}</span>
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted/65 rounded-full px-2 py-0.5">
                            {formatDateTime(item.at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Side: Quick Updates & Team Comment Editor */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Post Team Update</h4>
          <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-sm space-y-3">
            <Textarea
              placeholder="Add a comment or update for the team..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="bg-muted/10 border-border/80 rounded-xl text-xs p-3 focus-visible:ring-1"
            />
            <div className="flex justify-end">
              <Button onClick={submitComment} className="brand-gradient text-white border-0 shadow-md gap-1.5 h-9 px-4 text-xs font-bold">
                <Send className="h-3.5 w-3.5" /> Post Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
