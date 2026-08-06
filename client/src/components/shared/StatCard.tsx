import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  to,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  to?: string;
  tone?: 'default' | 'warning' | 'destructive';
}) {
  const navigate = useNavigate();

  return (
    <motion.div whileHover={to ? { y: -3 } : undefined} whileTap={to ? { scale: 0.98 } : undefined}>
      <Card
        onClick={to ? () => navigate(to) : undefined}
        className={cn('transition-shadow duration-200', to && 'cursor-pointer hover:shadow-md')}
      >
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              tone === 'destructive' && 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
              tone === 'warning' && 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
              tone === 'default' && 'bg-accent text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
