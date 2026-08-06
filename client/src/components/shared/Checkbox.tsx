import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Checkbox({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border transition-colors',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'bg-card',
        className,
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}
