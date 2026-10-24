'use client';

import { Heart, Lock, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  formatCompact,
  formatFull,
  formatRelativeDate,
  humanizeTask,
  monogram,
} from '@/lib/format';
import { Badge, FreshnessLabel } from '@/components/ui/Badge';
import { useShell } from '@/components/shell/ShellContext';
import type { RepoView } from '@/types/hf';

/**
 * Repository cards (§5.6). Each card is one button — the entire surface opens
 * the shared dialog. The inline bar is a share of the section's leading repo,
 * an honest relative measure, not a synthetic score.
 */
export function RepoGrid({
  repos,
  maxValue,
  className,
}: {
  repos: RepoView[];
  /** Lifetime downloads of the section leader, for relative bar widths. */
  maxValue: number;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'grid gap-3 sm:grid-cols-2 xl:grid-cols-3',
        className,
      )}
    >
      {repos.map((repo) => (
        <li key={repo.id}>
          <RepoCard repo={repo} maxValue={maxValue} />
        </li>
      ))}
    </ul>
  );
}

function RepoCard({ repo, maxValue }: { repo: RepoView; maxValue: number }) {
  const { openRepo } = useShell();
  const lifetime = repo.downloadsAllTime;
  const ratio = maxValue > 0 && lifetime !== null ? lifetime / maxValue : 0;

  return (
    <button
      type="button"
      onClick={(event) => openRepo(repo, event.currentTarget)}
      aria-label={`${repo.name} — open details`}
      className={cn(
        'group flex h-full w-full flex-col rounded-[20px] border border-border/70',
        'bg-surface p-5 text-left',
        'shadow-[0_1px_2px_rgba(26,31,27,.03),0_8px_20px_-16px_rgba(26,31,27,.25)] dark:border-border',
        'transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(.2,.8,.2,1)]',
        'hover:border-jade-300/80 hover:shadow-[0_16px_36px_-18px_rgba(26,31,27,.32)]',
        'hover:-translate-y-1 motion-reduce:hover:translate-y-0',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-500',
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className={cn(
            'num flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13.5px] font-semibold ring-1 ring-black/5 dark:ring-white/10',
            repo.kind === 'model'
              ? 'bg-jade-50 text-jade-700'
              : 'bg-surface-2 text-ink-2',
          )}
        >
          {monogram(repo.name)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">
            {repo.name}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">
            Updated {formatRelativeDate(repo.lastModified)}
          </span>
        </span>

        <span className="num flex shrink-0 items-center gap-1 text-[12px] text-ink-3">
          <Heart aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
          {formatCompact(repo.likes)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {repo.task ? <Badge tone="jade">{humanizeTask(repo.task)}</Badge> : null}
        {repo.libraryName ? <Badge tone="surface">{repo.libraryName}</Badge> : null}
        {repo.gated ? (
          <Badge tone="clay">
            <ShieldAlert aria-hidden="true" className="mr-1 h-3 w-3" strokeWidth={2} />
            Gated
          </Badge>
        ) : null}
        {repo.private ? (
          <Badge tone="clay">
            <Lock aria-hidden="true" className="mr-1 h-3 w-3" strokeWidth={2} />
            Private
          </Badge>
        ) : null}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="num text-[19px] font-semibold tracking-[-0.01em] text-ink"
            title={lifetime !== null ? formatFull(lifetime) : undefined}
          >
            {formatCompact(lifetime)}
          </span>
          <span className="num text-[11.5px] text-ink-3">
            {formatCompact(repo.downloads30d)} in 30d
          </span>
        </div>

        <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-surface-2">
          <span
            aria-hidden="true"
            className={cn(
              'hatch block h-full rounded-[var(--radius-pill)]',
              'transition-[filter] duration-[160ms]',
              repo.kind === 'model' ? 'bg-jade-500' : 'bg-clay',
            )}
            style={{ width: ratio > 0 ? `${Math.max(ratio * 100, 2)}%` : '0%' }}
          />
        </span>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <FreshnessLabel value={repo.freshness} withDot />
          <span className="truncate text-[11.5px] font-medium text-ink-3">
            {repo.libraryName ? repo.libraryName : repo.task ? humanizeTask(repo.task) : formatRelativeDate(repo.lastModified)}
          </span>
        </div>
      </div>
    </button>
  );
}
