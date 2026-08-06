import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PartyPopper,
  ListChecks,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useDashboardQuery } from '@/features/dashboard/useDashboard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, formatDateTime } from '@/lib/utils';
import { DateStrip } from '@/components/dashboard/DateStrip';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AttentionSection } from '@/components/dashboard/AttentionSection';

export function DashboardPage() {
  const { data, isLoading } = useDashboardQuery();
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, widgets } = data;
  const completionPercentage = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Rotaract Club of Salem Midtown — Dream to Deserve.</p>
        </div>
        <Button asChild className="brand-gradient text-white border-0 shadow-md gap-1.5 self-start sm:self-auto">
          <Link to="/events?create=1">
            <Plus className="h-4 w-4" /> Quick Add Event
          </Link>
        </Button>
      </div>

      {/* Scraped Paperpillar Horizontal Date Selector Strip */}
      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Scraped Tubik & Paperpillar Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total Events"
          value={stats.totalEvents}
          subtitle={`${stats.thisMonthEvents} scheduled this month`}
          icon={<PartyPopper className="h-5 w-5" />}
          variant="gradient-red"
        />
        <MetricCard
          title="Task Progress"
          value={`${completionPercentage}%`}
          subtitle={`${stats.completedTasks} of ${stats.totalTasks} tasks finished`}
          progress={completionPercentage}
          icon={<ListChecks className="h-5 w-5" />}
          variant="gradient-purple"
        />
        <MetricCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          subtitle={`${stats.highPriorityTasks} high priority`}
          trend={stats.highPriorityTasks > 0 ? `${stats.highPriorityTasks} Urgent` : undefined}
          trendUp={false}
          icon={<Clock className="h-5 w-5" />}
          variant="gradient-amber"
        />
        <MetricCard
          title="Overdue Items"
          value={stats.overdueTasks}
          subtitle="Requires immediate action"
          trend={stats.overdueTasks > 0 ? `${stats.overdueTasks} Action` : 'Clean'}
          trendUp={stats.overdueTasks === 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={stats.overdueTasks > 0 ? 'gradient-red' : 'default'}
        />
      </div>

      {/* Upcoming Events & Today's Tasks Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl shadow-sm border-border">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">Upcoming Club Events</CardTitle>
            <Link to="/events" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {widgets.upcomingEvents.length === 0 ? (
              <EmptyState title="No upcoming events" description="Create one to get started." />
            ) : (
              widgets.upcomingEvents.map((e) => (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 text-sm transition-all hover:bg-muted/60 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: e.color ?? '#b42244' }} />
                    <div>
                      <p className="font-semibold text-foreground">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.date)} {e.venue ? `· ${e.venue}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={e.priority} />
                    <StatusBadge status={e.status} kind="event" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">Today's Tasks</CardTitle>
            <Link to="/tasks" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {widgets.todaysTasks.length === 0 ? (
              <EmptyState title="Nothing due today" />
            ) : (
              widgets.todaysTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm bg-muted/30">
                  <span className="truncate font-medium text-foreground">{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integrated Attention & Overdue Section */}
      <AttentionSection attention={widgets.attention} />

      {/* Recent Activity & Completed Items */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Recently Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {widgets.recentlyCompleted.length === 0 ? (
              <EmptyState title="Nothing completed yet" />
            ) : (
              widgets.recentlyCompleted.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate font-medium text-foreground">{t.title}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-primary" /> Recent Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {widgets.recentActivity.length === 0 ? (
              <EmptyState title="No activity recorded" />
            ) : (
              widgets.recentActivity.slice(0, 5).map((a) => (
                <div key={a.id} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <p className="font-medium text-foreground">{a.summary}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
