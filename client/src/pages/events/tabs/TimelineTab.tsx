import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
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
  const { data: comments } = useCommentsQuery(eventId);
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea placeholder="Add a comment…" value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
        <Button onClick={submitComment} className="shrink-0 gap-1.5">
          <Send className="h-4 w-4" /> Post
        </Button>
      </div>

      {feed.length === 0 ? (
        <EmptyState title="Nothing here yet" />
      ) : (
        <div className="space-y-3 border-l border-border pl-4">
          {feed.map((item) => (
            <div key={item.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary" />
              <p className="flex items-center gap-1.5">
                {item.type === 'comment' && <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
                {item.text}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
