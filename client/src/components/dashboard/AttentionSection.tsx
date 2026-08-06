import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, ShieldAlert, CheckSquare, DollarSign, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Button } from '@/components/ui/button';

interface AttentionData {
  overdueTasks?: any[];
  highPriorityTasks?: any[];
  upcomingDeadlines?: any[];
  unassignedTasks?: any[];
  incompleteChecklists?: any[];
  missingDocuments?: any[];
  budgetPending?: any[];
}

export function AttentionSection({ attention }: { attention?: AttentionData }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overdue' | 'priority' | 'budget' | 'checklists'>('overdue');

  const overdue = attention?.overdueTasks ?? [];
  const priority = attention?.highPriorityTasks ?? [];
  const budget = attention?.budgetPending ?? [];
  const checklists = attention?.incompleteChecklists ?? [];

  const totalAttentionCount = overdue.length + priority.length + budget.length + checklists.length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">Action Needed & Overdues</h2>
              {totalAttentionCount > 0 && (
                <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                  {totalAttentionCount} items
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Critical tasks and event budget items requiring your attention.</p>
          </div>
        </div>

        {/* Action Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted/60 p-1 text-xs">
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'overdue' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-rose-500" />
            Overdue ({overdue.length})
          </button>
          <button
            onClick={() => setActiveTab('priority')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'priority' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            High Priority ({priority.length})
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'budget' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            Missing Budget ({budget.length})
          </button>
          <button
            onClick={() => setActiveTab('checklists')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'checklists' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
            Checklists ({checklists.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="space-y-2"
        >
          {activeTab === 'overdue' && (
            overdue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                🎉 Awesome! No overdue tasks at the moment.
              </div>
            ) : (
              overdue.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{t.title}</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      Overdue since {formatDate(t.deadline)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <Button size="sm" variant="outline" onClick={() => navigate(`/tasks`)} className="h-8 gap-1 text-xs">
                      View Task <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'priority' && (
            priority.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No critical or high priority items currently pending.
              </div>
            ) : (
              priority.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">Deadline: {formatDate(t.deadline)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <Button size="sm" variant="outline" onClick={() => navigate('/tasks')} className="h-8 gap-1 text-xs">
                      Inspect <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'budget' && (
            budget.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                All events have recorded budget allocations.
              </div>
            ) : (
              budget.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{e.name}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Budget allocation is pending</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/events/${e.id}`)} className="h-8 gap-1 text-xs">
                    Set Budget <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )
          )}

          {activeTab === 'checklists' && (
            checklists.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                All event preparation checklists are completed!
              </div>
            ) : (
              checklists.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{e.name}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">Checklist items remaining</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/events/${e.id}`)} className="h-8 gap-1 text-xs">
                    View Checklist <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
