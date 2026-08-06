import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { useTemplatesQuery, useCreateTemplate } from '@/features/templates/useTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface FormValues {
  name: string;
  category: string;
  description: string;
  itemsText: string;
}

export function TemplatesPage() {
  const { data: templates, isLoading } = useTemplatesQuery();
  const createTemplate = useCreateTemplate();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const items = values.itemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    await createTemplate.mutateAsync({ name: values.name, category: values.category || undefined, description: values.description || undefined, items });
    reset();
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable checklists for recurring event types.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !templates?.length ? (
        <EmptyState title="No templates yet" action={<Button onClick={() => setOpen(true)}>New Template</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>{t.name}</CardTitle>
                  {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {t.isBuiltIn && <Badge variant="secondary">Built-in</Badge>}
                <p className="text-xs text-muted-foreground">{t.items.length} checklist items</p>
                <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                  {t.items.slice(0, 6).map((i) => (
                    <li key={i.id}>· {i.label}</li>
                  ))}
                  {t.items.length > 6 && <li>+{t.items.length - 6} more</li>}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Awareness Program" {...register('name', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register('category')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="itemsText">Checklist items (one per line)</Label>
              <Textarea id="itemsText" rows={6} placeholder={'Venue Booking\nPoster Design\n...'} {...register('itemsText')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? 'Saving…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
