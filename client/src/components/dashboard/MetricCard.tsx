import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: ReactNode;
  variant?: 'default' | 'gradient-red' | 'gradient-purple' | 'gradient-amber' | 'dark';
  progress?: number; // 0 to 100
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendUp = true,
  icon,
  variant = 'default',
  progress,
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient-red':
        return 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-card border-rose-500/30 text-foreground';
      case 'gradient-purple':
        return 'bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-card border-violet-500/30 text-foreground';
      case 'gradient-amber':
        return 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-card border-amber-500/30 text-foreground';
      case 'dark':
        return 'bg-slate-900 text-white border-slate-800 shadow-xl';
      default:
        return 'bg-card text-card-foreground border-border';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all ${getVariantStyles()}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight">{value}</span>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  trendUp
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
        </div>

        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary p-2">
            {icon}
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-3.5 space-y-1">
          <div className="flex justify-between text-[11px] font-medium opacity-80">
            <span>Completion Gauge</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full brand-gradient"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
