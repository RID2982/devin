import { useState } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon, CheckSquare, Edit3 } from 'lucide-react';
import { TASK_STATUSES, PRIORITIES } from '@app/shared';
import { useTasksQuery, useCreateTask, useUpdateTask, useArchiveTask } from '@/features/tasks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';

export function TasksTab({ eventId }: { eventId: string }) {
  const { data, isLoading } = useTasksQuery({ eventId, pageSize: 100, sortBy: 'deadline' });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(eventId);
  const archiveTask = useArchiveTask();
  
  const [title, setTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  function addTask() {
    if (!title.trim()) return;
    createTask.mutate({ eventId, title: title.trim() });
    setTitle('');
  }

  function handleSaveTitle(taskId: string) {
    if (!editingTitle.trim()) return;
    updateTask.mutate({ id: taskId, title: editingTitle.trim() });
    setEditingTaskId(null);
  }

  return (
    <div className="space-y-4">
      {/* Task Creation Input */}
      <div className="flex gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/40">
        <Input
          placeholder="What needs to be done? Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          className="bg-card border-border/80 rounded-lg text-sm h-10"
        />
        <Button onClick={addTask} className="brand-gradient text-white border-0 shadow-md gap-1.5 shrink-0 h-10 px-4">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {isLoading ? null : !data?.data.length ? (
        <EmptyState title="No tasks yet" description="Add the first task for this event." />
      ) : (
        <div className="space-y-2.5">
          {data.data.map((task) => (
            <div
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl border border-border/70 bg-card hover:border-primary/45 transition-all shadow-sm group"
            >
              {/* Left Column: Inline Title Editor */}
              <div className="flex-1 min-w-[200px] flex items-center gap-3">
                <CheckSquare className={`h-4.5 w-4.5 shrink-0 ${task.status === 'Completed' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                {editingTaskId === task.id ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(task.id)}
                      onBlur={() => handleSaveTitle(task.id)}
                      autoFocus
                      className="h-8 text-xs font-semibold py-1 px-2.5"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditingTitle(task.title);
                      }}
                      className={`text-sm font-semibold text-foreground hover:text-primary cursor-pointer transition-colors ${
                        task.status === 'Completed' ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 transition-opacity"
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditingTitle(task.title);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column: Attribute Selectors */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {/* Deadline Picker */}
                <div className="flex items-center gap-1 text-xs border border-border/80 rounded-xl px-2 py-1 bg-muted/10">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  <input
                    type="date"
                    value={task.deadline ? task.deadline.slice(0, 10) : ''}
                    onChange={(e) => updateTask.mutate({ id: task.id, deadline: e.target.value || null })}
                    className="bg-transparent border-0 outline-none text-[11px] font-medium text-muted-foreground w-24 cursor-pointer"
                  />
                </div>

                {/* Priority Selector Dropdown */}
                <Select
                  value={task.priority}
                  onValueChange={(priority) => updateTask.mutate({ id: task.id, priority })}
                >
                  <SelectTrigger className="h-8 w-28 rounded-xl text-xs font-semibold border-border/80 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs font-semibold">
                        {p} Priority
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Selector Dropdown */}
                <Select
                  value={task.status}
                  onValueChange={(status) => updateTask.mutate({ id: task.id, status })}
                >
                  <SelectTrigger className="h-8 w-32 rounded-xl text-xs font-semibold border-border/80 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs font-semibold">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-xl shrink-0"
                  onClick={() => confirm('Are you sure you want to delete this task?') && archiveTask.mutate(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
