import { useState } from 'react';
import { Plus, Trash2, FileStack } from 'lucide-react';
import {
  useChecklistQuery,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '@/features/checklist/useChecklist';
import { useTemplatesQuery } from '@/features/templates/useTemplates';
import { useApplyTemplate } from '@/features/events/useEvents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/shared/Checkbox';
import { EmptyState } from '@/components/shared/EmptyState';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function ChecklistTab({ eventId }: { eventId: string }) {
  const { data: items, isLoading } = useChecklistQuery(eventId);
  const createItem = useCreateChecklistItem(eventId);
  const updateItem = useUpdateChecklistItem(eventId);
  const deleteItem = useDeleteChecklistItem(eventId);
  const { data: templates } = useTemplatesQuery();
  const applyTemplate = useApplyTemplate(eventId);
  const [label, setLabel] = useState('');

  function addItem() {
    if (!label.trim()) return;
    createItem.mutate(label.trim());
    setLabel('');
  }

  const doneCount = items?.filter((i) => i.isDone).length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items ? `${doneCount}/${items.length} complete` : 'Loading…'}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileStack className="h-3.5 w-3.5" /> Apply Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {templates?.length ? (
              templates.map((t) => (
                <DropdownMenuItem key={t.id} onSelect={() => applyTemplate.mutate(t.id)}>
                  {t.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No templates yet</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add checklist item…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <Button onClick={addItem} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? null : !items?.length ? (
        <EmptyState title="No checklist items" />
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2.5">
              <Checkbox checked={item.isDone} onCheckedChange={(checked) => updateItem.mutate({ id: item.id, isDone: checked })} />
              <span className={item.isDone ? 'flex-1 text-sm text-muted-foreground line-through' : 'flex-1 text-sm'}>{item.label}</span>
              <button onClick={() => deleteItem.mutate(item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
