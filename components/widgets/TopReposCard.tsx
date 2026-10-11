'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  formatCompact,
  formatRelativeDate,
  humanizeTask,
  monogram,
} from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { scrollToSection, useShell } from '@/components/shell/ShellContext';
import type { RepoView, TopRepoEntry } from '@/types/hf';

type TopWindow = '30d' | 'all';

export function TopReposCard({
  models,
  datasets,
  rawModels,
  rawDatasets,
  index = 0,
}: {
  models: TopRepoEntry[];
  datasets: TopRepoEntry[];
  rawModels?: RepoView[];
  rawDatasets?: RepoView[];
  index?: number;
}) {
  const [windowRange, setWindowRange] = useState<TopWindow>('30d');

  const modelEntries = useMemo<TopRepoEntry[]>(() => {
    if (windowRange === 'all' || !rawModels?.length) return models;
    const sorted = [...rawModels]
      .filter((r) => r.downloads30d > 0)
      .sort((a, b) => b.downloads30d - a.downloads30d)
      .slice(0, 3);
    const leader = sorted[0]?.downloads30d ?? 0;
    return sorted.map((repo) => ({
      repo,
      value: repo.downloads30d,
      progress: leader > 0 ? repo.downloads30d / leader : 0,
    }));
  }, [windowRange, rawModels, models]);

  const datasetEntries = useMemo<TopRepoEntry[]>(() => {
    if (windowRange === 'all' || !rawDatasets?.length) return datasets;
    const sorted = [...rawDatasets]
      .filter((r) => r.downloads30d > 0)
      .sort((a, b) => b.downloads30d - a.downloads30d)
      .slice(0, 3);
    const leader = sorted[0]?.downloads30d ?? 0;
    return sorted.map((repo) => ({
      repo,
      value: repo.downloads30d,
      progress: leader > 0 ? repo.downloads30d / leader : 0,
    }));
  }, [windowRange, rawDatasets, datasets]);

  const hasAny = modelEntries.length > 0 || datasetEntries.length > 0;

  return (
    <Card index={index} className="flex flex-col p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
          Top repositories
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex h-7 items-center rounded-[var(--radius-inner)] bg-surface-2 p-0.5">
            <button
              type="button"
              onClick={() => setWindowRange('30d')}
              aria-pressed={windowRange === '30d'}
              className={cn(
                'h-6 rounded-[9px] px-2.5 text-[11.5px] font-medium transition-colors duration-[160ms]',
                windowRange === '30d'
                  ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(16,20,18,.06)]'
                  : 'text-ink-3 hover:text-ink-2',
              )}
            >
              30d
            </button>
            <button
              type="button"
              onClick={() => setWindowRange('all')}
              aria-pressed={windowRange === 'all'}
              className={cn(
                'h-6 rounded-[9px] px-2.5 text-[11.5px] font-medium transition-colors duration-[160ms]',
                windowRange === 'all'
                  ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(16,20,18,.06)]'
                  : 'text-ink-3 hover:text-ink-2',
              )}
            >
              Lifetime
            </button>
          </div>
          <button
            type="button"
            onClick={() => scrollToSection('models')}
            className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-pill)] bg-surface-2 px-3 text-[12px] font-medium text-ink-2 transition-colors hover:bg-surface-3"
          >
            View models ›
          </button>
        </div>
      </div>

      {!hasAny ? (
        <p className="mt-5 text-[12.5px] text-ink-3">
          No download data available for this window yet.
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          {modelEntries.length > 0 ? (
            <Group
              label="Models"
              entries={modelEntries}
              tone="jade"
              windowRange={windowRange}
            />
          ) : null}
          {datasetEntries.length > 0 ? (
            <Group
              label="Datasets"
              entries={datasetEntries}
              tone="clay"
              windowRange={windowRange}
            />
          ) : null}
        </div>
      )}
    </Card>
  );
}

function Group({
  label,
  entries,
  tone,
  windowRange,
}: {
  label: string;
  entries: TopRepoEntry[];
  tone: 'jade' | 'clay';
  windowRange: TopWindow;
}) {
  return (
    <div>
      <p className="mb-2.5 text-[11.5px] uppercase tracking-wide text-ink-3">
        {label}
      </p>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <Row key={entry.repo.id} entry={entry} tone={tone} windowRange={windowRange} />
        ))}
      </ul>
    </div>
  );
}

function Row({
  entry,
  tone,
  windowRange,
}: {
  entry: TopRepoEntry;
  tone: 'jade' | 'clay';
  windowRange: TopWindow;
}) {
  const { openRepo } = useShell();
  const { repo, value, progress } = entry;

  return (
    <li>
      <button
        type="button"
        onClick={(event) => openRepo(repo, event.currentTarget)}
        className="group flex w-full items-center gap-3 rounded-[10px] p-1 text-left transition-colors duration-[140ms] hover:bg-surface-2/70"
      >
        <span
          className={cn(
            'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px]',
            'text-[14px] font-semibold',
            tone === 'jade' ? 'bg-jade-50 text-jade-700' : 'bg-clay-50 text-clay-700',
          )}
        >
          {monogram(repo.name)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-medium text-ink">
              {repo.name}
            </span>
            <span className="num shrink-0 text-[12px] text-ink-3">
              {windowRange === '30d' ? (
                <span className="font-semibold text-ink">{formatCompact(value)} in 30d</span>
              ) : (
                <>
                  <span className="text-ink">{formatCompact(repo.downloads30d)}</span>
                  {' / '}
                  {formatCompact(value)}
                </>
              )}
            </span>
          </span>

          <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-surface-2">
            <span
              className={cn(
                'hatch block h-full rounded-[var(--radius-pill)]',
                tone === 'jade' ? 'bg-jade-500' : 'bg-clay',
              )}
              style={{ width: `${Math.max(progress * 100, 2)}%` }}
            />
          </span>

          <span className="mt-1 block truncate text-[11px] text-ink-3">
            {repo.task
              ? humanizeTask(repo.task)
              : `Updated ${formatRelativeDate(repo.lastModified)}`}
          </span>
        </span>
      </button>
    </li>
  );
}
