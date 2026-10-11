import { cn } from '@/lib/cn';
import type { Freshness } from '@/types/hf';

const tones = {
  /** Task chips. jade-700 on jade-50 keeps small text AA-legible (§5.10). */
  jade: 'bg-jade-50 text-jade-700',
  /** Gated / Private. */
  clay: 'bg-clay-50 text-clay-700',
  surface: 'bg-surface-2 text-ink-2',
  /** Dark count pill in the sidebar tree. */
  ink: 'bg-jade-50 text-jade-700',
} as const;

export function Badge({
  tone = 'surface',
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-1',
        'text-[11px] font-medium leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 20px dark pill used for the dataset count in the sidebar tree. */
export function CountPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="num inline-flex h-5 min-w-5 items-center justify-center rounded-[var(--radius-pill)] bg-jade-50 px-1.5 text-[11px] font-semibold leading-none text-jade-700">
      {children}
    </span>
  );
}

const freshnessTone: Record<Freshness, string> = {
  Active: 'text-jade-600',
  Recent: 'text-ink-3',
  Stable: 'text-ink-3',
  // Maps the reference's "Declined" colour language onto real dormancy.
  Dormant: 'text-clay-700',
};

const freshnessDot: Record<Freshness, string> = {
  Active: 'bg-jade-500',
  Recent: 'bg-ink-3',
  Stable: 'bg-border-2',
  Dormant: 'bg-clay',
};

export function FreshnessLabel({
  value,
  withDot = false,
  className,
}: {
  value: Freshness;
  withDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium',
        freshnessTone[value],
        className,
      )}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', freshnessDot[value])}
        />
      ) : null}
      {value}
    </span>
  );
}
