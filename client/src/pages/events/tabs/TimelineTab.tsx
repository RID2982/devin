import { useState } from 'react';
import { MessageSquare, Send, PlusCircle, Trash2, RotateCcw, CheckCircle2, Activity, GanttChart, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventTimelineQuery, useEventQuery } from '@/features/events/useEvents';
import { useTasksQuery, TaskRecord } from '@/features/tasks/useTasks';
import { useCommentsQuery, useCreateComment } from '@/features/comments/useComments';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime, formatDate } from '@/lib/utils';

interface ActivityRow {
  id: string;
  summary: string;
  createdAt: string;
}

export function TimelineTab({ eventId }: { eventId: string }) {
  const { data: event } = useEventQuery(eventId);
  const { data: tasksData } = useTasksQuery({ eventId, archived: false });
  const tasks = tasksData?.data ?? [];

  const { data: activity } = useEventTimelineQuery(eventId) as { data: ActivityRow[] | undefined };
  const { data: comments } = useEventTimelineQuery(eventId) ? useCommentsQuery(eventId) : { data: undefined };
  const createComment = useCreateComment(eventId);
  const [body, setBody] = useState('');

  function submitComment() {
    if (!body.trim()) return;
    createComment.mutate(body.trim());
    setBody('');
  }

  const feed = [
    ...(activity ?? []).map((a) => ({ id: `a-${a.id}`, type: 'activity' as const, text: a.summary, at: a.createdAt })),
    ...(comments ?? []).map((c) => ({ id: `c-${c.id}`, type: 'comment' as const, text: c.body, at: c.createdAt })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // Dynamically assign node icons and color classes based on activity contents
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

  // Gantt Chart Date Range Calculation
  const getTimelineDates = () => {
    if (!event) return [];
    
    // Grid baseline is Event date
    const baseDate = new Date(event.date);
    
    // We search for earliest task start and latest task deadline
    let minTime = baseDate.getTime();
    let maxTime = baseDate.getTime();

    tasks.forEach((t: TaskRecord) => {
      const start = new Date(t.createdAt).getTime();
      const end = t.deadline ? new Date(t.deadline).getTime() : start;
      if (start < minTime) minTime = start;
      if (end > maxTime) maxTime = end;
    });

    // Pad 2 days before minTime and 5 days after maxTime
    const start = new Date(minTime);
    start.setDate(start.getDate() - 2);
    
    const end = new Date(maxTime);
    end.setDate(end.getDate() + 5);

    // Limit grid to maximum 24 days to avoid crowded columns
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 24) {
      end.setTime(start.getTime() + 24 * 1000 * 60 * 60 * 24);
    }

    const dateList: Date[] = [];
    const iterator = new Date(start);
    while (iterator <= end) {
      dateList.push(new Date(iterator));
      iterator.setDate(iterator.getDate() + 1);
    }
    return dateList;
  };

  const timelineDates = getTimelineDates();
  const gridStart = timelineDates.length > 0 ? timelineDates[0].getTime() : 0;
  const gridEnd = timelineDates.length > 0 ? timelineDates[timelineDates.length - 1].getTime() : 0;
  const gridDuration = gridEnd - gridStart || 1;

  const today = new Date();
  const showTodayLine = today.getTime() >= gridStart && today.getTime() <= gridEnd;
  const todayLeftPercent = showTodayLine ? ((today.getTime() - gridStart) / gridDuration) * 100 : 0;

  const eventTime = event ? new Date(event.date).getTime() : 0;
  const showEventLine = eventTime >= gridStart && eventTime <= gridEnd;
  const eventLeftPercent = showEventLine ? ((eventTime - gridStart) / gridDuration) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Gantt Chart Timeline Roadmap Box */}
      {event && (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/15 shadow-sm p-4 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <GanttChart className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Roadmap Timeline & Deadlines</h3>
            </div>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Event Target: {formatDate(event.date)}
            </span>
          </div>

          {timelineDates.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Generating timeline grid...</div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
              <p>No tasks configured for this event yet.</p>
              <p className="text-[10px] text-muted-foreground/60">Create tasks in the Tasks tab to plot them on the roadmap.</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto select-none rounded-xl border border-border/40 bg-card/65">
              <div className="min-w-[760px] relative">
                {/* Vertical lines and indicators overlay */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  {/* Today line indicator */}
                  {showTodayLine && (
                    <div 
                      className="absolute top-0 bottom-0 w-[2px] bg-blue-500/60 border-l border-dashed border-blue-400"
                      style={{ left: `calc(200px + (100% - 200px) * ${todayLeftPercent / 100})` }}
                      title="Today"
                    >
                      <span className="absolute top-1 -left-6 bg-blue-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">TODAY</span>
                    </div>
                  )}

                  {/* Event Target Line Indicator */}
                  {showEventLine && (
                    <div 
                      className="absolute top-0 bottom-0 w-[2px] bg-primary/70 border-l border-dashed border-primary"
                      style={{ left: `calc(200px + (100% - 200px) * ${eventLeftPercent / 100})` }}
                      title="Event Target Date"
                    >
                      <span className="absolute bottom-1 -left-8 bg-primary text-white text-[8px] font-bold px-1 py-0.5 rounded">EVENT TARGET</span>
                    </div>
                  )}
                </div>

                {/* Timeline Header (Days Grid) */}
                <div className="grid grid-cols-[200px_1fr] border-b border-border/45 bg-muted/20">
                  <div className="p-3 text-xs font-bold text-muted-foreground uppercase border-r border-border/45">Tasks & Actions</div>
                  <div className="flex w-full">
                    {timelineDates.map((date, idx) => {
                      const isEventDay = date.toDateString() === new Date(event.date).toDateString();
                      return (
                        <div 
                          key={idx} 
                          className={`flex-1 text-center py-2.5 text-[9px] font-bold border-r border-border/30 last:border-r-0 flex flex-col justify-center items-center ${isEventDay ? 'bg-primary/5 text-primary' : 'text-muted-foreground'}`}
                        >
                          <span className="uppercase text-[8px] opacity-75">{date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span>
                          <span className="text-[10px] font-extrabold">{date.getDate()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline Rows (Gantt Swimlanes) */}
                <div className="divide-y divide-border/35">
                  {tasks.map((task: TaskRecord) => {
                    const startVal = new Date(task.createdAt).getTime();
                    // If deadline is null, default task bar duration to 1 day
                    const endVal = task.deadline 
                      ? new Date(task.deadline).getTime() 
                      : startVal + 24 * 60 * 60 * 1000;

                    // Compute percentages inside our grid
                    const taskStartPercent = Math.min(100, Math.max(0, ((startVal - gridStart) / gridDuration) * 100));
                    const taskEndPercent = Math.min(100, Math.max(0, ((endVal - gridStart) / gridDuration) * 100));
                    const taskWidthPercent = Math.max(4, taskEndPercent - taskStartPercent); // minimum 4% width

                    // Select color gradient based on status/priority
                    const isDone = task.status === 'Completed';
                    const gradientClass = isDone 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/10'
                      : task.priority === 'High'
                        ? 'bg-gradient-to-r from-primary to-rose-500 shadow-primary/10'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/10';

                    return (
                      <div key={task.id} className="grid grid-cols-[200px_1fr] items-center hover:bg-muted/10 transition-colors">
                        {/* Swimlane Label */}
                        <div className="p-3 border-r border-border/45 flex flex-col min-w-0 pr-2">
                          <span className="text-xs font-bold text-foreground truncate" title={task.title}>{task.title}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                              isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>{task.status}</span>
                            <span className="text-[8px] font-bold text-muted-foreground/80">
                              {task.deadline ? formatDate(task.deadline, { month: 'short', day: 'numeric' }) : 'No deadline'}
                            </span>
                          </div>
                        </div>

                        {/* Swimlane Track */}
                        <div className="relative h-12 w-full flex items-center px-0.5">
                          {/* Grid cells guides */}
                          <div className="absolute inset-0 flex">
                            {timelineDates.map((_, idx) => (
                              <div key={idx} className="flex-1 border-r border-border/20 last:border-r-0 h-full" />
                            ))}
                          </div>

                          {/* Task Duration Bar */}
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            style={{ 
                              left: `${taskStartPercent}%`, 
                              width: `${taskWidthPercent}%`,
                              transformOrigin: 'left'
                            }}
                            className={`absolute h-6 rounded-lg ${gradientClass} shadow-sm z-20 flex items-center justify-between px-2 text-[9px] font-extrabold text-white`}
                            title={`${task.title} (${task.status})`}
                          >
                            <span className="truncate pr-1">{task.title}</span>
                            {task.deadline && <span className="shrink-0 opacity-90">{new Date(task.deadline).getDate()}</span>}
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vertical Timeline Activity and Comments feed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Activity Logs Feed */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider pl-1">Activity Log & Updates</h4>
          {feed.length === 0 ? (
            <EmptyState title="Nothing here yet" />
          ) : (
            <div className="relative pl-6 space-y-5">
              {/* Vertical connecting gradient line */}
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
                      {/* Glowing Node Icon Indicator */}
                      <div className={`absolute -left-[24px] top-1.5 z-10 flex h-8.5 w-8.5 items-center justify-center rounded-xl border shadow-sm transition-all group-hover:scale-105 ${node.colorClass}`}>
                        <NodeIcon className="h-4 w-4" />
                      </div>

                      {/* Activity Detail Card bubble */}
                      <div className="flex-1 bg-card/60 p-3 rounded-2xl border border-border/70 group-hover:border-primary/45 transition-all shadow-sm space-y-1">
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

        {/* Right Side: Quick Updates / Comments Composer */}
        <div className="md:col-span-1 space-y-4">
          <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider pl-1">Post Team Message</h4>
          <div className="bg-muted/20 p-4 rounded-2xl border border-border/40 space-y-3">
            <Textarea
              placeholder="Add a comment or update for the team..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="bg-card border-border/80 rounded-xl text-xs p-3 focus-visible:ring-1"
            />
            <div className="flex justify-end">
              <Button onClick={submitComment} className="brand-gradient text-white border-0 shadow-md gap-1.5 h-9 w-full font-bold text-xs">
                <Send className="h-3.5 w-3.5" /> Post Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
