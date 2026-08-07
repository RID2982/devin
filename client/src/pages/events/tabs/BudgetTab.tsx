import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUpdateEvent, type EventRecord } from '@/features/events/useEvents';
import { Plus, Trash2, Wallet, PlusCircle, ArrowUpRight, PiggyBank, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function BudgetTab({ event }: { event: EventRecord }) {
  const updateEvent = useUpdateEvent(event.id);
  const [allocatedBudget, setAllocatedBudget] = useState(event.budget ?? '');
  
  // Expense Form State
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('General');

  const expenses = event.expenses ?? [];
  const totalAllocated = Number(event.budget ?? 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const remainingBudget = totalAllocated - totalExpenses;
  const percentSpent = totalAllocated > 0 ? Math.min(100, Math.round((totalExpenses / totalAllocated) * 100)) : 0;

  const handleSaveBudget = () => {
    updateEvent.mutate({ budget: allocatedBudget === '' ? undefined : Number(allocatedBudget) });
  };

  const handleAddExpense = () => {
    if (!expenseName.trim() || !expenseAmount) return;
    const newExpense = {
      id: Math.random().toString(36).substring(2, 9),
      name: expenseName.trim(),
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      date: new Date().toISOString(),
    };
    const updatedExpenses = [...expenses, newExpense];
    updateEvent.mutate({ expenses: updatedExpenses }, {
      onSuccess: () => {
        setExpenseName('');
        setExpenseAmount('');
      },
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
    updateEvent.mutate({ expenses: updatedExpenses });
  };

  return (
    <div className="space-y-6">
      {/* Visual Analytics Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Allocated Budget Widget */}
        <Card className="rounded-2xl border-border/80 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Allocated Budget</span>
              <h3 className="text-xl font-extrabold text-foreground">₹{totalAllocated.toLocaleString('en-IN')}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <PiggyBank className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses Widget */}
        <Card className="rounded-2xl border-border/80 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Spent</span>
              <h3 className="text-xl font-extrabold text-destructive">₹{totalExpenses.toLocaleString('en-IN')}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Remaining Budget Widget */}
        <Card className="rounded-2xl border-border/80 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remaining Pool</span>
              <h3 className={`text-xl font-extrabold ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                ₹{remainingBudget.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${remainingBudget >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Setup Budget & Log Expenses */}
        <div className="lg:col-span-1 space-y-4">
          {/* Setup Allocated Budget */}
          <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-3.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">Setup Total Budget</h4>
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-xs font-semibold">Allocated budget (₹)</Label>
              <div className="flex gap-2">
                <Input
                  id="budget"
                  type="number"
                  step="1"
                  value={allocatedBudget}
                  onChange={(e) => setAllocatedBudget(e.target.value)}
                  className="h-9.5 rounded-lg text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleSaveBudget}
                  disabled={updateEvent.isPending}
                  className="brand-gradient text-white border-0 shadow-md px-4 shrink-0 font-semibold h-9.5"
                >
                  Save
                </Button>
              </div>
            </div>
          </Card>

          {/* Log Expense Form */}
          <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-3.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <PlusCircle className="h-4.5 w-4.5 text-primary" /> Log Expense Item
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="expenseName" className="text-xs font-semibold">Expense Name</Label>
                <Input
                  id="expenseName"
                  placeholder="e.g. Catering, Audio setup"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="h-9 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="expenseAmount" className="text-xs font-semibold">Cost (₹)</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    placeholder="0"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="h-9 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expenseCategory" className="text-xs font-semibold">Category</Label>
                  <select
                    id="expenseCategory"
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs ring-offset-background outline-none font-semibold cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="Catering">Catering</option>
                    <option value="Audio/Visual">Audio/Visual</option>
                    <option value="Venue Decoration">Decoration</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleAddExpense}
                disabled={updateEvent.isPending || !expenseName || !expenseAmount}
                className="w-full brand-gradient text-white border-0 shadow-md gap-1.5 h-9.5 rounded-lg text-xs font-bold mt-1"
              >
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side: Progress Bar & Expenses Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress bar card */}
          <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase">
              <span>Budget Usage Gauge</span>
              <span className={percentSpent > 90 ? 'text-destructive' : 'text-primary'}>
                {percentSpent}% Used
              </span>
            </div>
            <div className="h-3 w-full bg-muted/60 overflow-hidden rounded-full border border-border/40">
              <div
                className={`h-full rounded-full transition-all duration-300 ${percentSpent > 90 ? 'bg-destructive' : 'brand-gradient'}`}
                style={{ width: `${percentSpent}%` }}
              />
            </div>
          </Card>

          {/* Logged Expenses List */}
          <Card className="rounded-2xl border border-border/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 bg-muted/10">
              <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Tracked Expense Items
              </h4>
            </div>

            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No expense items recorded yet. Log your first expense to begin.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between gap-4 p-3 hover:bg-muted/10 transition-colors">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">{exp.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-md uppercase">
                            {exp.category ?? 'General'}
                          </span>
                          <span>{formatDate(exp.date)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-foreground">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                          onClick={() => handleDeleteExpense(exp.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
