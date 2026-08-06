import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNotesQuery, useCreateNote, useUpdateNote } from '@/features/notes/useNotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownNotesEditor } from '@/components/editor/MarkdownNotesEditor';
import { EmptyState } from '@/components/shared/EmptyState';

export function NotesTab({ eventId }: { eventId: string }) {
  const { data: notes, isLoading } = useNotesQuery(eventId);
  const createNote = useCreateNote(eventId);
  const updateNote = useUpdateNote(eventId);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = notes?.find((n) => n.id === activeId) ?? notes?.[0];

  if (isLoading) return null;

  if (!notes?.length) {
    return (
      <EmptyState
        title="No notes yet"
        description="Start a Markdown note for this event — it autosaves as you type."
        action={<Button onClick={() => createNote.mutate({ title: 'Untitled note', bodyMarkdown: '' })}>New Note</Button>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="space-y-1 md:col-span-1">
        <Button size="sm" variant="outline" className="mb-2 w-full gap-1.5" onClick={() => createNote.mutate({ title: 'Untitled note', bodyMarkdown: '' })}>
          <Plus className="h-3.5 w-3.5" /> New Note
        </Button>
        {notes.map((n) => (
          <button
            key={n.id}
            onClick={() => setActiveId(n.id)}
            className={`block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm ${
              active?.id === n.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {n.title || 'Untitled note'}
          </button>
        ))}
      </div>

      {active && (
        <div className="space-y-3 md:col-span-3">
          <Input
            defaultValue={active.title ?? ''}
            key={active.id}
            placeholder="Note title"
            onBlur={(e) => updateNote.mutate({ id: active.id, title: e.target.value })}
          />
          <MarkdownNotesEditor value={active.bodyMarkdown} onSave={(bodyMarkdown) => updateNote.mutate({ id: active.id, bodyMarkdown })} />
        </div>
      )}
    </div>
  );
}
