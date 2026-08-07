import { useState } from 'react';
import { MessageSquare, Send, PlusCircle, Trash2, RotateCcw, CheckCircle2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventTimelineQuery } from '@/features/events/useEvents';
import { useCommentsQuery, useCreateComment } from '@/features/comments/useComments';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';

interface ActivityRow {
  id: string;
  summary: string;
  createdAt: string;
}

export function TimelineTab({ eventId }: { eventId: string }) {
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

  return (
    <div className="space-y-6">
      {/* Premium Styled Comment Editor */}
      <div className="bg-muted/20 p-3 rounded-2xl border border-border/40 space-y-2">
        <Textarea
          placeholder="Add a comment or update for the team..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="bg-card border-border/80 rounded-xl text-sm p-3 focus-visible:ring-1"
        />
        <div className="flex justify-end">
          <Button onClick={submitComment} className="brand-gradient text-white border-0 shadow-md gap-1.5 h-9 px-4">
            <Send className="h-3.5 w-3.5" /> Post Comment
          </Button>
        </div>
      </div>

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
  );
}
