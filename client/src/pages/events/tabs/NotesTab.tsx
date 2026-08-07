import { useState } from 'react';
import { Plus, Trash2, Search, FileText } from 'lucide-react';
import { useNotesQuery, useCreateNote, useUpdateNote, useDeleteNote } from '@/features/notes/useNotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownNotesEditor } from '@/components/editor/MarkdownNotesEditor';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';

export function NotesTab({ eventId }: { eventId: string }) {
  const { data: notes, isLoading } = useNotesQuery(eventId);
  const createNote = useCreateNote(eventId);
  const updateNote = useUpdateNote(eventId);
  const deleteNote = useDeleteNote(eventId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) return null;

  const filteredNotes = (notes ?? []).filter((n) => {
    const titleMatch = (n.title ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const bodyMatch = (n.bodyMarkdown ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || bodyMatch;
  });

  const active = filteredNotes.find((n) => n.id === activeId) ?? filteredNotes[0];

  const handleCreate = () => {
    createNote.mutate({ title: 'Untitled Note', bodyMarkdown: '' }, {
      onSuccess: (newNote) => setActiveId(newNote.id),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this note?')) {
      deleteNote.mutate(id, {
        onSuccess: () => setActiveId(null),
      });
    }
  };

  if (!notes?.length) {
    return (
      <EmptyState
        title="No notes yet"
        description="Write a team note or draft for this event. Notes are autosaved as you type."
        action={
          <Button onClick={handleCreate} className="brand-gradient text-white border-0 shadow-md gap-1.5 rounded-xl font-semibold px-4 h-10">
            <Plus className="h-4 w-4" /> Create First Note
          </Button>
        }
      />
    );
  }

  // Extract a text-only preview snippet from markdown body
  const getNoteSnippet = (markdown: string) => {
    const clean = markdown
      .replace(/[#*`_\[\]()\-]/g, ' ') // remove simple markdown tokens
      .replace(/\s+/g, ' ') // collapse whitespaces
      .trim();
    return clean ? clean.slice(0, 45) + (clean.length > 45 ? '...' : '') : 'No additional text';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-border/80 overflow-hidden min-h-[480px] bg-card/40 shadow-sm">
      {/* LEFT COLUMN: Scrollable Notes List Sidebar (Apple-style) */}
      <div className="md:col-span-4 border-r border-border/80 bg-muted/20 flex flex-col h-[480px]">
        {/* Search & Actions Header */}
        <div className="p-3 border-b border-border/80 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">All Notes</span>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10" onClick={handleCreate}>
              <Plus className="h-4.5 w-4.5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search Notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8.5 rounded-lg text-xs bg-card border-border/60"
            />
          </div>
        </div>

        {/* Scrollable list items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No matching notes found</p>
          ) : (
            filteredNotes.map((n) => (
              <div
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={`flex flex-col gap-1 p-2.5 rounded-xl text-left cursor-pointer transition-all select-none ${
                  active?.id === n.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <span className="text-xs font-bold truncate">
                  {n.title || 'Untitled Note'}
                </span>
                <div className="flex items-center justify-between gap-1.5 text-[10px]">
                  <span className={`truncate flex-1 ${active?.id === n.id ? 'opacity-85' : 'text-muted-foreground'}`}>
                    {getNoteSnippet(n.bodyMarkdown)}
                  </span>
                  <span className={active?.id === n.id ? 'opacity-70' : 'text-muted-foreground/80'}>
                    {formatDateTime(n.updatedAt).split(',')[0]}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Minimalist Editor */}
      <div className="md:col-span-8 flex flex-col h-[480px] bg-card">
        {active ? (
          <div className="flex flex-col h-full">
            {/* Editor Action Header */}
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border/40 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Note Details
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                onClick={() => handleDelete(active.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Note Editor Workspace */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {/* Apple-style borderless title input */}
              <input
                defaultValue={active.title ?? ''}
                key={active.id}
                placeholder="Note Title"
                onBlur={(e) => updateNote.mutate({ id: active.id, title: e.target.value || 'Untitled Note' })}
                className="w-full bg-transparent border-0 outline-none text-xl font-bold tracking-tight text-foreground placeholder:opacity-50"
              />
              
              <div className="border-t border-border/40 pt-3">
                <MarkdownNotesEditor
                  value={active.bodyMarkdown}
                  onSave={(bodyMarkdown) => updateNote.mutate({ id: active.id, bodyMarkdown })}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
            <FileText className="h-10 w-10 stroke-[1.25] text-muted-foreground/60" />
            <p className="text-xs font-semibold">Select a note to read or edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
