'use client';

import { cn } from '@/lib/cn';
import {
  formatCompact,
  formatFull,
  formatRelativeDate,
  humanizeTask,
  monogram,
} from '@/lib/format';
import { FreshnessLabel } from '@/components/ui/Badge';
import { useShell } from '@/components/shell/ShellContext';
import type { RepoKind, RepoView } from '@/types/hf';

/**
 * Dense table view (§5.6). Rows are keyboard-activatable and open the same
 * dialog as the cards. Horizontally scrollable below lg rather than reflowed,
 * so the numeric columns stay aligned.
 */
export function RepoTable({
  repos,
  kind,
  className,
}: {
  repos: RepoView[];
  kind: RepoKind;
  className?: string;
}) {
  const { openRepo } = useShell();

  return (
    <div className={cn('-mx-1 overflow-x-auto px-1', className)}>
      <table className="w-full min-w-[680px] border-collapse text-left">
        <caption className="sr-only">
          {kind === 'model' ? 'Models' : 'Datasets'} with lifetime downloads,
          30-day downloads, likes, size and last update.
        </caption>
        <thead>
          <tr className="border-b border-border">
            <Th className="w-[38%]">Repository</Th>
            <Th align="right">Lifetime</Th>
            <Th align="right">30 days</Th>
            <Th align="right">Likes</Th>
            <Th align="right">Framework / Task</Th>
            <Th align="right">Updated</Th>
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => (
            <tr
              key={repo.id}
              className={cn(
                'border-b border-border transition-colors duration-[140ms]',
                'hover:bg-surface-2/70',
              )}
            >
              <Td>
                <button
                  type="button"
                  onClick={(event) => openRepo(repo, event.currentTarget)}
                  className="group flex min-w-0 items-center gap-2.5 text-left"
                  aria-label={`${repo.name} — open details`}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold ring-1 ring-black/5 dark:ring-white/10',
                      repo.kind === 'model'
                        ? 'bg-jade-50 text-jade-700'
                        : 'bg-surface-2 text-ink-2',
                    )}
                  >
                    {monogram(repo.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink group-hover:text-jade-700">
                      {repo.name}
                    </span>
                    <span className="block truncate text-[11px] text-ink-3">
                      {repo.task ? humanizeTask(repo.task) : repo.libraryName ?? '—'}
                    </span>
                  </span>
                </button>
              </Td>
              <Td align="right">
                <span
                  className="num text-[13px] font-medium text-ink"
                  title={
                    repo.downloadsAllTime !== null
                      ? formatFull(repo.downloadsAllTime)
                      : undefined
                  }
                >
                  {formatCompact(repo.downloadsAllTime)}
                </span>
              </Td>
              <Td align="right">
                <span className="num text-[13px] text-ink-2">
                  {formatCompact(repo.downloads30d)}
                </span>
              </Td>
              <Td align="right">
                <span className="num text-[13px] text-ink-2">
                  {formatCompact(repo.likes)}
                </span>
              </Td>
              <Td align="right">
                <span className="inline-block max-w-[130px] truncate text-[12px] font-medium text-ink-2">
                  {repo.libraryName ?? (repo.task ? humanizeTask(repo.task) : '—')}
                </span>
              </Td>
              <Td align="right">
                <span className="block text-[12px] text-ink-2">
                  {formatRelativeDate(repo.lastModified)}
                </span>
                <FreshnessLabel value={repo.freshness} className="mt-0.5" />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-2 pb-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td className={cn('px-2 py-2.5 align-middle', align === 'right' && 'text-right')}>
      {children}
    </td>
  );
}
