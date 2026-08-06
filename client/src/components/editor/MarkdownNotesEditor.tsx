import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Eye, Pencil } from 'lucide-react';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

export function MarkdownNotesEditor({
  value,
  onSave,
}: {
  value: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => setDraft(value), [value]);

  const debouncedSave = useDebouncedCallback((next: string) => {
    onSave(next);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1500);
  }, 800);

  function handleChange(next: string) {
    setDraft(next);
    setStatus('saving');
    debouncedSave(next);
  }

  const html = DOMPurify.sanitize(marked.parse(draft || '', { async: false }) as string);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button variant={mode === 'write' ? 'default' : 'outline'} size="sm" onClick={() => setMode('write')} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Write
          </Button>
          <Button variant={mode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setMode('preview')} className="gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ''}
        </span>
      </div>

      {mode === 'write' ? (
        <Textarea rows={12} value={draft} onChange={(e) => handleChange(e.target.value)} placeholder="Write notes in Markdown…" />
      ) : (
        <div className="prose prose-sm max-w-none rounded-md border border-border p-4 dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
