'use client';

import { Compass, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ORG_DISPLAY_NAME, ORG_URL } from '@/lib/constants';

/**
 * The "Public research hub" promo, relocated from the old sidebar into the
 * grid (reference: "Keep you safe!" card). Same dismiss key, same link.
 */
export function PromoCard({
  onDismiss,
  index = 0,
  className,
}: {
  onDismiss: () => void;
  index?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border/70 bg-surface p-5 sm:p-6',
        'shadow-[0_1px_2px_rgba(26,31,27,.03),0_12px_32px_-28px_rgba(26,31,27,.28)] dark:border-border',
        'animate-[card-in_420ms_cubic-bezier(.2,.8,.2,1)_both]',
        'lg:flex-row lg:items-center lg:gap-6 xl:flex-col xl:items-center xl:justify-center xl:gap-0 xl:text-center',
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-jade-100/70 blur-3xl dark:bg-jade-200/30" />

      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      </button>

      <span className="relative mb-4 inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-jade-100 bg-jade-50 text-jade-600 lg:mb-0 xl:mb-5">
        <span className="absolute inset-1.5 rounded-full border border-dashed border-jade-200" />
        <Compass aria-hidden="true" className="h-7 w-7" strokeWidth={1.5} />
      </span>

      <div className="relative min-w-0 lg:flex-1 xl:flex-none">
        <p className="font-display text-[19px] font-semibold tracking-[-0.015em] text-ink">
          Public research hub
        </p>
        <p className="mx-auto mt-1.5 max-w-[30ch] text-[12.5px] leading-[1.55] text-ink-3 lg:mx-0 xl:mx-auto">
          Explore every {ORG_DISPLAY_NAME} model and dataset, refreshed every 12 hours.
        </p>
      </div>

      <a
        href={ORG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="relative mt-5 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-action px-5 text-[13px] font-semibold text-on-action shadow-[0_10px_22px_-12px_color-mix(in_srgb,var(--color-action)_90%,transparent)] transition-[background-color,transform] hover:bg-action-hover active:scale-[.98] lg:mt-0 xl:mt-5"
      >
        Open organization
        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
      </a>
    </div>
  );
}
