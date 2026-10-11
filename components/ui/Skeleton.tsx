import { cn } from '@/lib/cn';

/**
 * Shimmer block matching a real element's silhouette (§5.9). Pass the same
 * radius and dimensions as the element it stands in for.
 */
export function Skeleton({
  className,
  radius = 'inner',
}: {
  className?: string;
  radius?: 'inner' | 'card' | 'pill' | 'none';
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-[shimmer_1.4s_ease-in-out_infinite] bg-surface-2',
        'bg-[linear-gradient(90deg,var(--color-surface-2)_0%,var(--color-surface-3)_50%,var(--color-surface-2)_100%)]',
        'bg-[length:200%_100%]',
        radius === 'inner' && 'rounded-[var(--radius-inner)]',
        radius === 'card' && 'rounded-[var(--radius-card)]',
        radius === 'pill' && 'rounded-[var(--radius-pill)]',
        className,
      )}
    />
  );
}

export function SkeletonText({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          radius="pill"
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}
