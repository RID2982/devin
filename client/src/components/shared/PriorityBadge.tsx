import { Badge } from '@/components/ui/badge';

const VARIANT: Record<string, 'secondary' | 'outline' | 'warning' | 'destructive'> = {
  Low: 'outline',
  Medium: 'secondary',
  High: 'warning',
  Critical: 'destructive',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant={VARIANT[priority] ?? 'secondary'}>{priority}</Badge>;
}
