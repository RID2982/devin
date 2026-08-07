import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Plus, CheckCircle2, FolderHeart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTemplatesQuery, useCreateTemplate } from '@/features/templates/useTemplates';
import { useNavigate } from 'react-router-dom';

interface FormValues {
  name: string;
  category: string;
  description: string;
  itemsText: string;
}

export function TemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: templates, isLoading } = useTemplatesQuery();
  const createTemplate = useCreateTemplate();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<FormValues>();

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  async function onSubmit(values: FormValues) {
    const items = values.itemsText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    await createTemplate.mutateAsync({
      name: values.name,
      category: values.category || undefined,
      description: values.description || undefined,
      items,
    });

    reset();
    setShowCreateForm(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
            <FileText className="h-5 w-5 text-primary" /> Proposal & Checklist Templates
          </DialogTitle>
        </DialogHeader>

        {showCreateForm ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="template-name">Template Name</Label>
              <Input id="template-name" placeholder="e.g. Installation Ceremony" {...register('name', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-category">Category</Label>
              <Input id="template-category" placeholder="e.g. Protocol" {...register('category')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-desc">Description</Label>
              <Textarea id="template-desc" rows={2} placeholder="Brief summary of the template proposal..." {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-items">Checklist Items (One per line)</Label>
              <Textarea
                id="template-items"
                rows={5}
                placeholder="Confirm Chief Guest&#10;Book catering&#10;Decorate main hall..."
                {...register('itemsText', { required: true })}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Back to Templates
              </Button>
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? 'Saving...' : 'Create Proposal Template'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-2">
            {/* List side */}
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Template</span>
                <Button size="sm" variant="outline" className="gap-1 text-xs py-1 h-7" onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-3 w-3" /> New
                </Button>
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {isLoading ? (
                  <p className="text-xs text-muted-foreground">Loading templates...</p>
                ) : templates?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No templates available.</p>
                ) : (
                  templates?.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        selectedTemplateId === t.id
                          ? 'bg-primary/10 border-primary text-primary shadow-sm'
                          : 'border-border bg-card text-foreground hover:bg-muted/40'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Preview side */}
            <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-border/80 pt-3 md:pt-0 md:pl-4">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">{selectedTemplate.name}</h3>
                    {selectedTemplate.category && (
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                        {selectedTemplate.category}
                      </span>
                    )}
                    {selectedTemplate.description && (
                      <p className="text-xs text-muted-foreground mt-1.5">{selectedTemplate.description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checklist Preview</span>
                    <div className="rounded-xl border border-border bg-muted/20 p-3 max-h-48 overflow-y-auto space-y-1.5">
                      {selectedTemplate.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs text-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full brand-gradient text-white border-0 shadow-md gap-1.5"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/events?create=1&templateId=${selectedTemplate.id}`);
                    }}
                  >
                    <FolderHeart className="h-4 w-4" /> Create Event with this Template
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-medium">Select a checklist template proposal on the left to preview details.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
