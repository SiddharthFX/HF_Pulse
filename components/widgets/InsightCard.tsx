'use client';

import { ChevronRight } from 'lucide-react';
import { ORG_DISPLAY_NAME } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { formatPct } from '@/lib/format';
import { scrollToSection } from '@/components/shell/ShellContext';
import type { DerivedStats } from '@/types/hf';

/**
 * The "quick tips" analogue. Body copy is generated from real derived data —
 * no canned marketing text, no invented advice.
 */
export function InsightCard({
  stats,
  index = 0,
}: {
  stats: DerivedStats;
  index?: number;
}) {
  const { leadingRepo, leadingRepoShare, updatedLast30d, repoCount } = stats;

  return (
    <Card index={index} className="relative overflow-hidden p-4 sm:p-6">
      <div className="relative z-10 max-w-[62%] max-[900px]:max-w-full">
        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          Where {ORG_DISPLAY_NAME}&rsquo;s downloads come from
        </h3>

        <p className="mt-2 text-[13px] leading-[1.5] text-ink-2">
          {leadingRepo && leadingRepoShare !== null ? (
            <>
              <span className="font-medium text-ink">{leadingRepo.name}</span>{' '}
              accounts for {formatPct(leadingRepoShare)} of lifetime downloads.{' '}
            </>
          ) : (
            <>Lifetime download data isn&rsquo;t available for these repositories yet. </>
          )}
          {updatedLast30d} of {repoCount.total}{' '}
          {repoCount.total === 1 ? 'repository was' : 'repositories were'} updated in
          the last 30 days.
        </p>

        <button
          type="button"
          onClick={() => scrollToSection('models')}
          className="mt-3 inline-flex min-h-10 items-center gap-1 text-[13px] font-medium text-ink transition-colors hover:text-jade-700 sm:mt-4 sm:min-h-0"
        >
          View breakdown
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      <PixelStaircase />
    </Card>
  );
}

/**
 * Signature decorative motif (§5.5e): an ascending staircase of rounded
 * squares across three rows, jade-100 → jade-500 with clay/lime punctuation.
 * Purely decorative — masked and pointer-events-none.
 */
function PixelStaircase() {
  const squares: ReadonlyArray<{ x: number; y: number; color: string; opacity: number }> = [
    { x: 0, y: 2, color: 'var(--color-jade-100)', opacity: 0.5 },
    { x: 1, y: 2, color: 'var(--color-jade-100)', opacity: 0.6 },
    { x: 2, y: 2, color: 'var(--color-jade-200)', opacity: 0.55 },
    { x: 3, y: 2, color: 'var(--color-clay)', opacity: 0.45 },
    { x: 4, y: 2, color: 'var(--color-jade-200)', opacity: 0.7 },

    { x: 1, y: 1, color: 'var(--color-jade-200)', opacity: 0.6 },
    { x: 2, y: 1, color: 'var(--color-jade-300)', opacity: 0.75 },
    { x: 3, y: 1, color: 'var(--color-jade-300)', opacity: 0.85 },
    { x: 4, y: 1, color: 'var(--color-lime)', opacity: 0.55 },
    { x: 5, y: 1, color: 'var(--color-jade-400)', opacity: 0.8 },

    { x: 3, y: 0, color: 'var(--color-jade-400)', opacity: 0.9 },
    { x: 4, y: 0, color: 'var(--color-jade-500)', opacity: 0.85 },
    { x: 5, y: 0, color: 'var(--color-jade-500)', opacity: 1 },
    { x: 6, y: 0, color: 'var(--color-jade-500)', opacity: 0.75 },
  ];

  const CELL = 22;
  const SIZE = 18;

  return (
    <div
      aria-hidden="true"
      className="mask-fade-l pointer-events-none absolute bottom-5 right-5 select-none max-[900px]:opacity-40 max-[500px]:hidden"
      style={{ width: CELL * 7, height: CELL * 3 }}
    >
      {squares.map((sq) => (
        <span
          key={`${sq.x}-${sq.y}`}
          className="absolute rounded-[5px]"
          style={{
            width: SIZE,
            height: SIZE,
            left: sq.x * CELL,
            top: sq.y * CELL,
            backgroundColor: sq.color,
            opacity: sq.opacity,
          }}
        />
      ))}
    </div>
  );
}
