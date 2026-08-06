import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Renders the club logo from any raster/vector format (PNG/SVG/JPG/WebP) via `src`.
 * Falls back to a wordmark placeholder until a real logo file is provided —
 * drop the final asset in `client/public/` and pass its path as `src`
 * (or set it once in `client/src/config/brand.ts`).
 */
export function Logo({ src, className, iconOnly = false }: { src?: string; className?: string; iconOnly?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt="Club logo"
        className={cn('object-contain', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  if (iconOnly) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg font-bold text-primary-foreground',
          className,
        )}
        style={{ backgroundImage: 'var(--brand-gradient)' }}
      >
        C
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col leading-none', className)}>
      <span className="text-xs font-semibold tracking-wide text-primary">Rotaract Club of</span>
      <span className="text-sm font-extrabold tracking-wide text-secondary dark:text-accent-foreground">SALEM MIDTOWN</span>
    </div>
  );
}
