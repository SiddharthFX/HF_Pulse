'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCompact } from '@/lib/format';
import { useShell } from '@/components/shell/ShellContext';
import type { RepoView } from '@/types/hf';

const MAX_RESULTS = 6;

/** Subsequence match — "tlm" matches "tiny-llm". Returns null when no match. */
function fuzzyScore(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (!q) return 0;

  const direct = t.indexOf(q);
  // Exact substring beats a scattered subsequence; earlier is better.
  if (direct !== -1) return direct;

  let ti = 0;
  let gaps = 0;
  for (const char of q) {
    const found = t.indexOf(char, ti);
    if (found === -1) return null;
    gaps += found - ti;
    ti = found + 1;
  }
  return 1000 + gaps;
}

export function SearchField({
  className,
  autoFocus = false,
  enableShortcut = true,
  returnFocusRef,
  onClose,
}: {
  className?: string;
  autoFocus?: boolean;
  enableShortcut?: boolean;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  onClose?: () => void;
}) {
  const { repos, openRepo } = useShell();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      setOpen(true);
    }
  }, [autoFocus]);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return repos
      .map((repo) => ({ repo, score: fuzzyScore(trimmed, repo.name) }))
      .filter((r): r is { repo: RepoView; score: number } => r.score !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX_RESULTS)
      .map((r) => r.repo);
  }, [query, repos]);

  useEffect(() => setActiveIndex(0), [query]);

  // ⌘K / Ctrl+K focuses the field.
  useEffect(() => {
    if (!enableShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = inputRef.current;
        if (input && input.offsetParent !== null) {
          input.focus();
          setOpen(true);
        } else {
          window.dispatchEvent(new Event('pluto:open-search'));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableShortcut]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function selectRepo(repo: RepoView) {
    openRepo(repo, returnFocusRef?.current ?? inputRef.current);
    setOpen(false);
    onClose?.();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
      onClose?.();
      return;
    }
    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const repo = results[activeIndex];
      if (repo) selectRepo(repo);
    }
  }

  const showPanel = open && query.trim().length > 0;

  useEffect(() => {
    if (!showPanel || results.length === 0) return;
    document.getElementById(`${listId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listId, results.length, showPanel]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3"
          strokeWidth={1.7}
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listId : undefined}
          aria-activedescendant={
            showPanel && results.length > 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-label="Search repositories"
          placeholder="Search models and datasets..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            'h-[44px] w-full rounded-[var(--radius-pill)] bg-surface/90 pl-[44px] pr-14',
            'text-[13.5px] text-ink placeholder:text-ink-3',
            'border border-border shadow-[0_1px_2px_rgba(16,23,19,.04)]',
            'transition-[background-color,border-color,box-shadow] duration-200',
            'hover:border-border-2 focus:border-jade-300 focus:bg-surface focus:outline-none',
            'focus:ring-4 focus:ring-jade-500/10',
          )}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[9.5px] font-semibold text-ink-3 sm:flex"
          >
            <span>⌘</span>K
          </kbd>
        )}
      </div>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className={cn(
            'absolute left-0 right-0 top-[50px] z-40 overflow-hidden rounded-[16px]',
            'border border-border bg-surface/95 p-1.5 backdrop-blur-xl',
            'shadow-[0_20px_50px_-18px_rgba(16,23,19,.35)]',
          )}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-[12.5px] text-ink-3">
              No repositories match “{query.trim()}”
            </p>
          ) : (
            results.map((repo, i) => (
              <button
                key={repo.id}
                id={`${listId}-option-${i}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectRepo(repo)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-[120ms]',
                  i === activeIndex && 'bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 text-[11px] font-medium',
                    repo.kind === 'model'
                      ? 'bg-jade-50 text-jade-700'
                      : 'bg-surface-2 text-ink-2',
                  )}
                >
                  {repo.kind === 'model' ? 'Model' : 'Dataset'}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                  {repo.name}
                </span>
                <span className="num shrink-0 text-[12px] text-ink-3">
                  {formatCompact(repo.downloadsAllTime ?? repo.downloads30d)}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
