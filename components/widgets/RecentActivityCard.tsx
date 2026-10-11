'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  formatAbsoluteDate,
  formatCompact,
  monogram,
} from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { FreshnessLabel } from '@/components/ui/Badge';
import { useShell } from '@/components/shell/ShellContext';
import type { RepoView } from '@/types/hf';

type ActivityWindow = '7d' | '30d' | '90d' | 'all';
type SortKey = 'updated' | 'downloads';

const WINDOWS = [
  { value: '7d' as const, label: '7d' },
  { value: '30d' as const, label: '30d' },
  { value: '90d' as const, label: '90d' },
  { value: 'all' as const, label: 'All' },
];

const WINDOW_DAYS: Record<ActivityWindow, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

export function RecentActivityCard({
  repos,
  index = 0,
}: {
  repos: RepoView[];
  index?: number;
}) {
  const { openRepo } = useShell();
  const [activeWindow, setActiveWindow] = useState<ActivityWindow>('90d');
  const [sortKey, setSortKey] = useState<SortKey>('updated');

  const rows = useMemo(() => {
    const days = WINDOW_DAYS[activeWindow];
    const filtered =
      days === null
        ? [...repos]
        : repos.filter((r) => r.ageDays !== null && r.ageDays <= days);

    return filtered.sort((a, b) => {
      if (sortKey === 'downloads') {
        return (b.downloadsAllTime ?? 0) - (a.downloadsAllTime ?? 0);
      }
      const at = a.lastModified ? Date.parse(a.lastModified) : 0;
      const bt = b.lastModified ? Date.parse(b.lastModified) : 0;
      return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
    });
  }, [repos, activeWindow, sortKey]);

  return (
    <Card index={index} className="flex flex-col p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
          Recent activity
        </h3>
        <div className="flex h-7 items-center rounded-[var(--radius-inner)] bg-surface-2 p-0.5">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => setActiveWindow(w.value)}
              aria-pressed={activeWindow === w.value}
              className={cn(
                'h-6 rounded-[9px] px-2 text-[11.5px] font-medium transition-colors duration-[160ms]',
                activeWindow === w.value
                  ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(16,20,18,.06)]'
                  : 'text-ink-3 hover:text-ink-2',
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setSortKey('updated')}
          aria-pressed={sortKey === 'updated'}
          className={cn(
            'inline-flex items-center gap-1.5 text-[11.5px] transition-colors',
            sortKey === 'updated' ? 'font-medium text-ink' : 'text-ink-3 hover:text-ink-2',
          )}
        >
          <ArrowUpDown aria-hidden="true" className="h-3 w-3" strokeWidth={1.8} />
          Last Updated
        </button>
        <button
          type="button"
          onClick={() => setSortKey('downloads')}
          aria-pressed={sortKey === 'downloads'}
          className={cn(
            'text-[11.5px] transition-colors',
            sortKey === 'downloads' ? 'font-medium text-ink' : 'text-ink-3 hover:text-ink-2',
          )}
        >
          Downloads
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-5 text-[12.5px] text-ink-3">
          No repositories were updated in this window.
        </p>
      ) : (
        <ul className="mask-fade-b scrollbar-none max-h-[420px] flex-1 overflow-y-auto">
          {rows.map((repo, i) => (
            <li key={repo.id}>
              <button
                type="button"
                onClick={(event) => openRepo(repo, event.currentTarget)}
                className={cn(
                  'flex h-14 w-full items-center gap-3 text-left transition-colors duration-[140ms]',
                  'hover:bg-surface-2/70',
                  i !== rows.length - 1 && 'border-b border-border',
                )}
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-jade-50 text-[11.5px] font-semibold text-jade-700">
                  {monogram(repo.name)}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block max-w-[140px] truncate text-[13px] font-medium text-ink">
                    {repo.name}
                  </span>
                  <span className="block text-[11.5px] text-ink-3" suppressHydrationWarning>
                    {formatAbsoluteDate(repo.lastModified)}
                  </span>
                </span>

                <span className="shrink-0 text-right">
                  <span
                    className={cn(
                      'num block text-[13px] font-semibold',
                      // Models read as positive contribution; datasets stay
                      // neutral. No invented negatives (§5.5i).
                      repo.kind === 'model' ? 'text-jade-600' : 'text-ink',
                    )}
                  >
                    {repo.kind === 'model' ? '+' : ''}
                    {formatCompact(repo.downloadsAllTime ?? repo.downloads30d)}
                  </span>
                  <FreshnessLabel value={repo.freshness} className="mt-0.5" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
