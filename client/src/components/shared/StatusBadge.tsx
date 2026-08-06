import { Badge } from '@/components/ui/badge';

const EVENT_STATUS_VARIANT: Record<string, 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  Planning: 'secondary',
  InProgress: 'warning',
  Completed: 'success',
  Cancelled: 'destructive',
  OnHold: 'outline',
};

const TASK_STATUS_VARIANT: Record<string, 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  Pending: 'secondary',
  InProgress: 'warning',
  Completed: 'success',
  Blocked: 'destructive',
  Cancelled: 'outline',
};

function splitLabel(status: string) {
  return status.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function StatusBadge({ status, kind = 'task' }: { status: string; kind?: 'task' | 'event' }) {
  const variant = (kind === 'event' ? EVENT_STATUS_VARIANT : TASK_STATUS_VARIANT)[status] ?? 'secondary';
  return <Badge variant={variant}>{splitLabel(status)}</Badge>;
}
