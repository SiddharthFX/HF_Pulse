'use client';

import { useMemo, useState } from 'react';
import { Box, Database, LayoutGrid, Rows3 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { humanizeTask } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { CountPill } from '@/components/ui/Badge';
import { RangeSelect } from '@/components/ui/RangeSelect';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { usePersistentState } from '@/components/shell/ShellContext';
import { RepoGrid } from '@/components/widgets/RepoGrid';
import { RepoTable } from '@/components/widgets/RepoTable';
import type { FetchFailure, RepoKind, RepoView } from '@/types/hf';

export type RepoSort = 'lifetime' | 'downloads30d' | 'likes' | 'updated' | 'name';
export type RepoViewMode = 'grid' | 'table';
export type TimeFilter = 'all' | '7d' | '30d' | '90d';

const SORTS = [
  { value: 'lifetime' as const, label: 'Lifetime downloads' },
  { value: 'downloads30d' as const, label: 'Last 30 days' },
  { value: 'likes' as const, label: 'Likes' },
  { value: 'updated' as const, label: 'Recently updated' },
  { value: 'name' as const, label: 'Name (A–Z)' },
];

const TIME_FILTER_DAYS: Record<TimeFilter, number | null> = {
  all: null,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const TIME_FILTERS: ReadonlyArray<{ value: TimeFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

/** Sorts descending for magnitudes, ascending for names. Nulls always sink. */
export function sortRepos(repos: RepoView[], sort: RepoSort): RepoView[] {
  const time = (iso: string | null) => {
    if (!iso) return 0;
    const t = Date.parse(iso);
    return Number.isNaN(t) ? 0 : t;
  };

  return [...repos].sort((a, b) => {
    switch (sort) {
      case 'downloads30d':
        return b.downloads30d - a.downloads30d;
      case 'likes':
        return b.likes - a.likes;
      case 'updated':
        return time(b.lastModified) - time(a.lastModified);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lifetime':
      default:
        return (b.downloadsAllTime ?? -1) - (a.downloadsAllTime ?? -1);
    }
  });
}

/**
 * Shared anatomy for both collection sections (§5.6): header with a live
 * count, time window filter, sort control, grid/table toggle, then the chosen view.
 */
export function RepoSection({
  id,
  title,
  subtitle,
  kind,
  repos,
  error,
  viewStorageKey,
  groupByTask = false,
  index = 0,
}: {
  id: string;
  title: string;
  subtitle: string;
  kind: RepoKind;
  repos: RepoView[];
  error: FetchFailure | null;
  viewStorageKey: string;
  groupByTask?: boolean;
  index?: number;
}) {
  const [sort, setSort] = useState<RepoSort>('lifetime');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [view, setView] = usePersistentState<RepoViewMode>(viewStorageKey, 'grid');

  const filteredRepos = useMemo(() => {
    const maxDays = TIME_FILTER_DAYS[timeFilter];
    if (maxDays === null) return repos;
    return repos.filter((r) => r.ageDays !== null && r.ageDays <= maxDays);
  }, [repos, timeFilter]);

  const sorted = useMemo(() => sortRepos(filteredRepos, sort), [filteredRepos, sort]);

  /** Task buckets, largest first, with untagged repos last. */
  const groups = useMemo(() => {
    if (!groupByTask) return null;
    const byTask = new Map<string, RepoView[]>();
    for (const repo of sorted) {
      const key = repo.task ?? '__untagged__';
      const bucket = byTask.get(key);
      if (bucket) bucket.push(repo);
      else byTask.set(key, [repo]);
    }
    return [...byTask.entries()]
      .map(([task, items]) => ({
        task,
        label: task === '__untagged__' ? 'No task declared' : humanizeTask(task),
        items,
      }))
      .sort((a, b) => {
        if (a.task === '__untagged__') return 1;
        if (b.task === '__untagged__') return -1;
        return b.items.length - a.items.length;
      });
  }, [groupByTask, sorted]);

  const maxValue = useMemo(
    () => sorted.reduce((acc, r) => Math.max(acc, r.downloadsAllTime ?? 0), 0),
    [sorted],
  );

  return (
    <Card as="section" index={index} id={id} className="scroll-mt-[88px] p-4 sm:p-6" aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h2
            id={`${id}-title`}
            className="text-[16px] font-semibold tracking-[-0.01em] text-ink"
          >
            {title}
          </h2>
          <CountPill>{filteredRepos.length}{filteredRepos.length !== repos.length ? ` / ${repos.length}` : ''}</CountPill>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Recency Time Filter Buttons */}
          <div className="flex h-11 items-center rounded-[var(--radius-inner)] bg-surface-2 p-0.5 sm:h-8">
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={() => setTimeFilter(tf.value)}
                aria-pressed={timeFilter === tf.value}
                className={cn(
                  'h-10 rounded-[11px] px-3.5 text-[13px] font-medium transition-colors duration-[160ms] sm:h-7 sm:px-2.5 sm:text-[12px]',
                  timeFilter === tf.value
                    ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(16,20,18,.06)]'
                    : 'text-ink-3 hover:text-ink-2',
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <RangeSelect
            label="Sort by"
            value={sort}
            options={SORTS}
            onChange={setSort}
          />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      <p className="mt-1 text-[12px] text-ink-3">{subtitle}</p>

      {error ? (
        <ErrorState
          className="mt-5"
          message={`${title} could not be loaded.`}
          detail={error.error}
        />
      ) : repos.length === 0 ? (
        <EmptyState
          className="mt-2"
          icon={kind === 'model' ? Box : Database}
          title={`No public ${kind === 'model' ? 'models' : 'datasets'} yet`}
          description={`This organization has no public ${
            kind === 'model' ? 'models' : 'datasets'
          } on the Hub right now. New ones appear here within 12 hours of publishing.`}
        />
      ) : view === 'table' ? (
        <RepoTable repos={sorted} kind={kind} className="mt-4" />
      ) : groups ? (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <div key={group.task}>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-3">
                  {group.label}
                </h3>
                <span className="num text-[11.5px] text-ink-3">
                  {group.items.length}
                </span>
              </div>
              <RepoGrid repos={group.items} maxValue={maxValue} />
            </div>
          ))}
        </div>
      ) : (
        <RepoGrid repos={sorted} maxValue={maxValue} className="mt-5" />
      )}
    </Card>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: RepoViewMode;
  onChange: (next: RepoViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex h-11 items-center gap-0.5 rounded-[var(--radius-inner)] bg-surface-2 p-0.5 sm:h-8"
    >
      <ToggleButton
        active={value === 'grid'}
        label="Grid view"
        onClick={() => onChange('grid')}
      >
        <LayoutGrid aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
      </ToggleButton>
      <ToggleButton
        active={value === 'table'}
        label="Table view"
        onClick={() => onChange('table')}
      >
        <Rows3 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 w-11 items-center justify-center rounded-[8px] sm:h-7 sm:w-8',
        'transition-colors duration-[140ms]',
        active ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(16,20,18,.06)]' : 'text-ink-3 hover:text-ink-2',
      )}
    >
      {children}
    </button>
  );
}
