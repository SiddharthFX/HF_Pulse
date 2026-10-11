'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Hatched progress fill. Animates width from 0 on mount over 700ms ease-out
 * (§5.5d); the animation is skipped under prefers-reduced-motion.
 */
export function ProgressBar({
  /** 0..1. Clamped. */
  value,
  height = 30,
  tone = 'jade',
  className,
  label,
  animate = true,
}: {
  value: number;
  height?: number;
  tone?: 'jade' | 'clay';
  className?: string;
  label?: string;
  animate?: boolean;
}) {
  const target = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const [width, setWidth] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate) {
      setWidth(target);
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setWidth(target);
      return;
    }
    const raf = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-[var(--radius-pill)] bg-surface-2',
        className,
      )}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(target * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn(
          'hatch h-full rounded-[var(--radius-pill)]',
          'transition-[width] duration-700 ease-out',
          tone === 'jade' ? 'bg-jade-500' : 'bg-clay',
        )}
        style={{ width: `${width * 100}%` }}
      />
    </div>
  );
}
