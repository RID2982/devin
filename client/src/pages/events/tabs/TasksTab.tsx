import { useState } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon, CheckSquare, FileStack, ListChecks } from 'lucide-react';
import { TASK_STATUSES, PRIORITIES } from '@app/shared';
import { useTasksQuery, useCreateTask, useUpdateTask, useArchiveTask } from '@/features/tasks/useTasks';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/shared/Checkbox';
import { EmptyState } from '@/components/shared/EmptyState';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function TasksTab({ eventId }: { eventId: string }) {
  // Tasks Query & Mutations
  const { data: tasksData, isLoading: tasksLoading } = useTasksQuery({ eventId, pageSize: 100, sortBy: 'deadline' });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(eventId);
  const archiveTask = useArchiveTask();

  const [taskTitle, setTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Checklist Query & Mutations
  const { data: checklistItems, isLoading: checklistLoading } = useChecklistQuery(eventId);
  const createChecklistItem = useCreateChecklistItem(eventId);
  const updateChecklistItem = useUpdateChecklistItem(eventId);
  const deleteChecklistItem = useDeleteChecklistItem(eventId);
  const { data: templates } = useTemplatesQuery();
  const applyTemplate = useApplyTemplate(eventId);

  const [checklistLabel, setChecklistLabel] = useState('');

  function handleAddTask() {
    if (!taskTitle.trim()) return;
    createTask.mutate({ eventId, title: taskTitle.trim() });
    setTaskTitle('');
  }

  function handleSaveTaskTitle(taskId: string) {
    if (!editingTaskTitle.trim()) return;
    updateTask.mutate({ id: taskId, title: editingTaskTitle.trim() });
    setEditingTaskId(null);
  }

  function handleAddChecklistItem() {
    if (!checklistLabel.trim()) return;
    createChecklistItem.mutate(checklistLabel.trim());
    setChecklistLabel('');
  }

  const doneCount = checklistItems?.filter((i) => i.isDone).length ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* LEFT COLUMN: Tasks Workspace */}
      <div className="space-y-4 border-r border-border/40 pr-0 md:pr-6">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">Tasks Workspace</h3>
        </div>

        <div className="flex gap-2 bg-muted/20 p-2 rounded-xl border border-border/40">
          <Input
            placeholder="Add a new task…"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="bg-card border-border/80 rounded-lg text-xs h-9"
          />
          <Button onClick={handleAddTask} className="brand-gradient text-white border-0 shadow-sm gap-1 shrink-0 h-9 px-3 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {tasksLoading ? null : !tasksData?.data.length ? (
          <EmptyState title="No tasks yet" description="Add the first task for this event." />
        ) : (
          <div className="space-y-2">
            {tasksData.data.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-2 p-3 rounded-xl border border-border/70 bg-card hover:border-primary/45 transition-all shadow-sm group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckSquare className={`h-4 w-4 shrink-0 ${task.status === 'Completed' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    {editingTaskId === task.id ? (
                      <Input
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTaskTitle(task.id)}
                        onBlur={() => handleSaveTaskTitle(task.id)}
                        autoFocus
                        className="h-7 text-xs font-semibold py-0.5 px-2 flex-1"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditingTaskTitle(task.title);
                        }}
                        className={`text-xs font-semibold text-foreground hover:text-primary cursor-pointer truncate ${
                          task.status === 'Completed' ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => confirm('Are you sure you want to delete this task?') && archiveTask.mutate(task.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <input
                      type="date"
                      value={task.deadline ? task.deadline.slice(0, 10) : ''}
                      onChange={(e) => updateTask.mutate({ id: task.id, deadline: e.target.value || null })}
                      className="bg-transparent border-0 outline-none w-20 cursor-pointer text-[10px]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Select
                      value={task.priority}
                      onValueChange={(priority) => updateTask.mutate({ id: task.id, priority })}
                    >
                      <SelectTrigger className="h-6 w-20 rounded-lg text-[9px] font-bold border-border/80 bg-card px-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p} className="text-[10px] font-bold">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={task.status}
                      onValueChange={(status) => updateTask.mutate({ id: task.id, status })}
                    >
                      <SelectTrigger className="h-6 w-22 rounded-lg text-[9px] font-bold border-border/80 bg-card px-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-[10px] font-bold">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Checklist Workspace */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Event Checklist</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-[10px] rounded-lg">
                <FileStack className="h-3 w-3" /> Apply Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {templates?.length ? (
                templates.map((t) => (
                  <DropdownMenuItem key={t.id} onSelect={() => applyTemplate.mutate(t.id)} className="text-xs font-semibold">
                    {t.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled className="text-xs">No templates yet</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 bg-muted/20 p-2 rounded-xl border border-border/40">
          <Input
            placeholder="Add checklist item…"
            value={checklistLabel}
            onChange={(e) => setChecklistLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
            className="bg-card border-border/80 rounded-lg text-xs h-9"
          />
          <Button onClick={handleAddChecklistItem} className="brand-gradient text-white border-0 shadow-sm gap-1 shrink-0 h-9 px-3 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {checklistLoading ? null : !checklistItems?.length ? (
          <EmptyState title="No checklist items" description="Apply a template or add items manually." />
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase px-1">
              Checklist Progress: {doneCount}/{checklistItems.length} Completed
            </p>
            <div className="divide-y divide-border/40 rounded-xl border border-border/70 bg-card overflow-hidden">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Checkbox
                      checked={item.isDone}
                      onCheckedChange={(checked) => updateChecklistItem.mutate({ id: item.id, isDone: checked })}
                    />
                    <span className={`text-xs font-semibold truncate ${item.isDone ? 'text-muted-foreground line-through opacity-65' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteChecklistItem.mutate(item.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
