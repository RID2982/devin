import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlannerQuery } from '@/features/planner/usePlanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function PlannerPage() {
  const { year: yearParam } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const { data, isLoading } = usePlannerQuery(year);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly Planner</h1>
          <p className="text-sm text-muted-foreground">Every event, organized month by month. Nothing is ever deleted.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(`/planner/${year - 1}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-16 text-center text-lg font-semibold">{year}</span>
          <Button variant="outline" size="icon" onClick={() => navigate(`/planner/${year + 1}`)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.months.map((m) => (
            <Card key={m.month}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {MONTH_NAMES[m.month - 1]}
                  <span className="text-xs font-normal text-muted-foreground">{m.events.length} event{m.events.length === 1 ? '' : 's'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {m.events.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No events</p>
                ) : (
                  m.events.map((e) => (
                    <Link
                      key={e.id}
                      to={`/events/${e.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: e.color ?? '#b42244' }} />
                      <span className="truncate">{e.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatDate(e.date, { month: 'short', day: 'numeric' })}</span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
