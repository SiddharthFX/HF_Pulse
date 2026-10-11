'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Database,
  Ellipsis,
  History,
  MoreVertical,
  RotateCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { ORG, ORG_URL, REFRESH_COOLDOWN_MS } from '@/lib/constants';
import { monogram } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { scrollToSection, useShell } from '@/components/shell/ShellContext';
import type { OrgIdentity, RepoView } from '@/types/hf';

export function OrgIdentityCard({
  org: _org,
  repos,
  modelCount,
  datasetCount,
  index = 0,
}: {
  org: OrgIdentity;
  repos: RepoView[];
  modelCount: number;
  datasetCount: number;
  index?: number;
}) {
  const router = useRouter();
  const { openRepo } = useShell();
  const [refreshing, setRefreshing] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const lastRefresh = useRef(0);

  // Close the "More" menu on click-outside / Escape, like every other popover.
  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const topSix = [...repos]
    .sort((a, b) => (b.downloadsAllTime ?? 0) - (a.downloadsAllTime ?? 0))
    .slice(0, 6);

  return (
    <Card index={index} className="flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
            Organization
          </h3>
          <p className="mt-0.5 text-[12px] text-ink-3">Quick actions</p>
        </div>
        <a
          href={ORG_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-pill)] bg-surface-2 px-3 text-[12px] font-medium text-ink-2 transition-colors hover:bg-surface-3"
        >
          + Follow
        </a>
      </div>

      {/* Card visual with the stacked peek card behind it. */}
      <div
        className="relative mt-4 h-[132px]"
        onMouseEnter={() => setSwapped(true)}
        onMouseLeave={() => setSwapped(false)}
      >
        <div
          aria-hidden="true"
          className={cn(
            'absolute right-0 top-3 h-[120px] w-[62%] rounded-[var(--radius-inner)] bg-surface-2',
            'flex items-start justify-end p-3 transition-transform duration-[260ms] ease-[cubic-bezier(.2,.8,.2,1)]',
            swapped ? 'translate-x-2 scale-100' : 'translate-x-4 scale-[.96]',
          )}
        >
          <span className="text-[11px] font-medium text-ink-3">Datasets</span>
        </div>

        <div
          className={cn(
            'hatch-soft relative h-[132px] w-[86%] overflow-hidden rounded-[var(--radius-inner)] p-4',
            'bg-[linear-gradient(135deg,#0FA871_0%,#0B8A5D_100%)]',
            'transition-transform duration-[260ms] ease-[cubic-bezier(.2,.8,.2,1)]',
            swapped && 'translate-x-1',
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase tracking-wide text-white/80">
              Organization
            </span>
            <span aria-hidden="true" className="text-[15px] leading-none">
              🤗
            </span>
          </div>

          <span
            aria-hidden="true"
            className="mt-4 block h-5 w-7 rounded-[4px] bg-white/25"
          />

          <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-2">
            <span className="truncate text-[12.5px] font-medium text-white">
              {ORG}
            </span>
            <span className="num shrink-0 text-[11.5px] text-white/75">
              {modelCount} models · {datasetCount} datasets
            </span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-5 grid grid-cols-5 gap-2">
        <QuickAction
          icon={Box}
          label="Models"
          onClick={() => scrollToSection('models')}
        />
        <QuickAction
          icon={Database}
          label="Datasets"
          onClick={() => scrollToSection('datasets')}
        />
        <QuickAction
          icon={RotateCw}
          label="Refresh"
          iconClassName={refreshing ? 'animate-[spin_900ms_linear_infinite]' : undefined}
          onClick={async () => {
            const now = Date.now();
            if (refreshing || now - lastRefresh.current < REFRESH_COOLDOWN_MS) return;
            lastRefresh.current = now;
            setRefreshing(true);
            try {
              await fetch('/api/revalidate', { method: 'POST' });
              router.refresh();
            } finally {
              setTimeout(() => setRefreshing(false), 600);
            }
          }}
        />
        <QuickAction
          icon={History}
          label="Activity"
          onClick={() => scrollToSection('activity')}
        />
        <div ref={moreRef} className="relative">
          <QuickAction
            icon={Ellipsis}
            label="More"
            onClick={() => setMoreOpen((o) => !o)}
          />
          {moreOpen ? (
            <div className="absolute bottom-full right-0 z-30 mb-2 w-[184px] rounded-[var(--radius-inner)] border border-border bg-surface p-1.5 shadow-[0_8px_24px_-8px_rgba(16,20,18,.16)]">
              <MoreItem
                label="Open on Hugging Face"
                onClick={() => {
                  window.open(ORG_URL, '_blank', 'noopener,noreferrer');
                  setMoreOpen(false);
                }}
              />
              <MoreItem
                label="Copy org URL"
                onClick={() => {
                  void navigator.clipboard?.writeText(ORG_URL);
                  setMoreOpen(false);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Top repositories */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-semibold text-ink">Top repositories</p>
          <button
            type="button"
            aria-label="Top repository options"
            onClick={() => scrollToSection('models')}
            className="rounded-md p-1 text-ink-3 transition-colors hover:text-ink"
          >
            <MoreVertical aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto">
          {topSix.map((repo) => (
            <button
              key={repo.id}
              type="button"
              onClick={() => openRepo(repo)}
              className="group flex w-[52px] shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'inline-flex h-11 w-11 items-center justify-center rounded-[12px]',
                  'bg-jade-50 text-[13px] font-semibold text-jade-700',
                  'transition-transform duration-[180ms] group-hover:-translate-y-0.5',
                )}
              >
                {monogram(repo.name)}
              </span>
              <span className="w-full truncate text-center text-[11px] text-ink-3">
                {repo.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  iconClassName,
}: {
  icon: typeof Box;
  label: string;
  onClick: () => void;
  iconClassName?: string;
}) {
  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center gap-1.5">
      <span
        className={cn(
          'inline-flex h-[52px] w-full items-center justify-center rounded-[var(--radius-inner)]',
          'bg-surface-2 text-ink-2 transition-colors duration-[160ms] group-hover:bg-surface-3',
        )}
      >
        <Icon aria-hidden="true" className={cn('h-[18px] w-[18px]', iconClassName)} strokeWidth={1.6} />
      </span>
      <span className="text-[11.5px] text-ink-2">{label}</span>
    </button>
  );
}

function MoreItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-[10px] px-2.5 py-2 text-left text-[12.5px] text-ink-2 transition-colors hover:bg-surface-2"
    >
      {label}
    </button>
  );
}
