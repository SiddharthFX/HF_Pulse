'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Box,
  Check,
  Copy,
  Database,
  Download,
  Heart,
  Lock,
  ShieldAlert,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  formatAbsoluteDate,
  formatCompact,
  formatFull,
  formatPct,
  formatRelativeDate,
  humanizeTask,
  monogram,
} from '@/lib/format';
import { momentumPct } from '@/lib/hf/derive';
import { Badge, FreshnessLabel } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useShell } from '@/components/shell/ShellContext';
import type { RepoView } from '@/types/hf';

const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/**
 * The single detail surface (§5.7). Every click target in the dashboard —
 * repo card, table row, top-repo row, activity row, legend row, search
 * result — routes here through ShellContext.openRepo.
 *
 * Modal on >=640px, bottom sheet below. Focus is trapped while open and
 * restored by closeRepo().
 */
export function RepoConfirmDialog() {
  const { dialogRepo, closeRepo } = useShell();
  return dialogRepo ? (
    <DialogBody key={dialogRepo.id} repo={dialogRepo} onClose={closeRepo} />
  ) : null;
}

function DialogBody({ repo, onClose }: { repo: RepoView; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Escape + focus trap.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>('[data-dashboard-scroll]');
    const previousBody = document.body.style.overflow;
    const previousScroll = scrollContainer?.style.overflow ?? '';
    const previousInert = scrollContainer?.getAttribute('inert') ?? null;
    const previousAriaHidden = scrollContainer?.getAttribute('aria-hidden') ?? null;
    document.body.style.overflow = 'hidden';
    if (scrollContainer) {
      scrollContainer.style.overflow = 'hidden';
      scrollContainer.setAttribute('inert', '');
      scrollContainer.setAttribute('aria-hidden', 'true');
    }
    return () => {
      document.body.style.overflow = previousBody;
      if (scrollContainer) {
        scrollContainer.style.overflow = previousScroll;
        if (previousInert === null) scrollContainer.removeAttribute('inert');
        else scrollContainer.setAttribute('inert', previousInert);
        if (previousAriaHidden === null) scrollContainer.removeAttribute('aria-hidden');
        else scrollContainer.setAttribute('aria-hidden', previousAriaHidden);
      }
    };
  }, []);

  // Move focus into the panel on open — the close button is first in DOM order.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const target = panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    requestAnimationFrame(() => target.focus());
  }, []);

  const copyId = useCallback(() => {
    void navigator.clipboard
      ?.writeText(repo.id)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {
        /* clipboard unavailable — the id is selectable in the header */
      });
  }, [repo.id]);

  const share = useMemo(() => momentumPct(repo), [repo]);
  const hasLifetime = repo.downloadsAllTime !== null;

  const AI_TAG_PATTERN =
    /^(lovable|gpt[-_.]?|kimi[-_.]?|claude[-_.]?|chatgpt|openai|anthropic|gemini|v0|bolt)/i;
  const tags = repo.tags
    .filter(
      (t) =>
        !t.includes(':') &&
        !AI_TAG_PATTERN.test(t) &&
        t.toLowerCase() !== 'ai',
    )
    .slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[#07100b]/45 animate-[overlay-in_180ms_ease-out_both] motion-reduce:animate-none"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="repo-dialog-title"
        aria-describedby="repo-dialog-desc"
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[88dvh] w-full flex-col overflow-hidden bg-surface outline-none',
          'rounded-t-[var(--radius-card)] sm:max-w-[520px] sm:rounded-[var(--radius-card)]',
          'shadow-[0_24px_64px_-16px_rgba(16,20,18,.28)]',
          'animate-[sheet-in_260ms_cubic-bezier(.2,.8,.2,1)_both]',
          'sm:animate-[panel-in_220ms_cubic-bezier(.2,.8,.2,1)_both]',
          'motion-reduce:animate-none',
        )}
      >
        {/* Sheet grab handle, mobile only. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border-2 sm:hidden"
        />

        <header className="flex items-start gap-3.5 px-5 pb-4 pt-4 sm:px-6 sm:pt-6">
          <span
            aria-hidden="true"
            className={cn(
              'num flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-inner)]',
              'text-[15px] font-semibold',
              repo.kind === 'model'
                ? 'bg-jade-50 text-jade-700'
                : 'bg-surface-2 text-ink-2',
            )}
          >
            {monogram(repo.name)}
          </span>

          <div className="min-w-0 flex-1">
            <h2
              id="repo-dialog-title"
              className="truncate text-[17px] font-semibold tracking-[-0.01em] text-ink"
            >
              {repo.name}
            </h2>
            <p id="repo-dialog-desc" className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[12px] text-ink-3">
                {repo.kind === 'model' ? 'Model' : 'Dataset'}
              </span>
              <span aria-hidden="true" className="text-ink-3">
                ·
              </span>
              <FreshnessLabel value={repo.freshness} withDot />
              <span aria-hidden="true" className="text-ink-3">
                ·
              </span>
              <span className="text-[12px] text-ink-3">
                Updated {formatRelativeDate(repo.lastModified)}
              </span>
            </p>
          </div>

          <IconButton
            aria-label="Close details"
            size={32}
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-1 sm:px-6">
          {repo.private || repo.gated ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {repo.private ? (
                <Badge tone="clay">
                  <Lock aria-hidden="true" className="mr-1 h-3 w-3" strokeWidth={2} />
                  Private
                </Badge>
              ) : null}
              {repo.gated ? (
                <Badge tone="clay">
                  <ShieldAlert aria-hidden="true" className="mr-1 h-3 w-3" strokeWidth={2} />
                  Gated access
                </Badge>
              ) : null}
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-2.5">
            <Stat
              icon={Download}
              label="Downloads · lifetime"
              value={formatCompact(repo.downloadsAllTime)}
              title={hasLifetime ? formatFull(repo.downloadsAllTime) : undefined}
            />
            <Stat
              icon={Download}
              label="Downloads · last 30 days"
              value={formatCompact(repo.downloads30d)}
              title={formatFull(repo.downloads30d)}
            />
            <Stat icon={Heart} label="Likes" value={formatCompact(repo.likes)} />
            <Stat
              icon={repo.kind === 'model' ? Box : Database}
              label="Framework / Task"
              value={repo.libraryName ? repo.libraryName : repo.task ? humanizeTask(repo.task) : 'Standard'}
            />
          </dl>

          {hasLifetime && (repo.downloadsAllTime ?? 0) > 0 ? (
            <div className="mt-4 rounded-[var(--radius-inner)] bg-surface-2 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12px] font-medium text-ink-2">
                  30-day share of lifetime
                </p>
                <p className="num text-[14px] font-semibold text-ink">
                  {formatPct(share)}
                </p>
              </div>
              <ProgressBar
                value={share}
                height={8}
                className="mt-2.5 bg-surface-3"
                label={`30-day downloads are ${formatPct(share)} of lifetime downloads`}
              />
              <p className="mt-2.5 text-[11.5px] leading-[1.45] text-ink-3">
                {formatFull(repo.downloads30d)} of {formatFull(repo.downloadsAllTime)}{' '}
                lifetime downloads landed in the last 30 days. This is a share, not a
                growth rate — the Hub API exposes no historical series.
              </p>
            </div>
          ) : null}

          <dl className="mt-4 divide-y divide-border border-t border-border">
            <MetaRow label="Repository" value={repo.id} mono />
            <MetaRow
              label={repo.kind === 'model' ? 'Task' : 'Category'}
              value={humanizeTask(repo.task)}
            />
            {repo.libraryName ? (
              <MetaRow label="Library" value={repo.libraryName} />
            ) : null}
            <MetaRow label="Created" value={formatAbsoluteDate(repo.createdAt)} />
            <MetaRow label="Last modified" value={formatAbsoluteDate(repo.lastModified)} />
          </dl>

          {tags.length > 0 ? (
            <div className="mt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">
                Tags
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <li key={tag}>
                    <Badge tone="surface">{tag}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col gap-2.5 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:items-center sm:px-6 sm:py-4">
          <Button variant="surface" onClick={copyId} className="w-full sm:w-auto">
            {copied ? (
              <Check aria-hidden="true" className="h-4 w-4 text-jade-600" strokeWidth={2} />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            )}
            {copied ? 'Copied' : 'Copy ID'}
          </Button>
          <LinkButton
            variant="jade"
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1"
          >
            {repo.kind === 'model' ? (
              <Download aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <Database aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            )}
            Open on Hugging Face
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </LinkButton>
        </footer>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  title,
}: {
  icon: typeof Download;
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="rounded-[var(--radius-inner)] bg-surface-2 px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
        {label}
      </dt>
      <dd className="num mt-1.5 text-[19px] font-semibold tracking-[-0.01em] text-ink" title={title}>
        {value}
      </dd>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[12px] text-ink-3">{label}</dt>
      <dd
        className={cn(
          'min-w-0 truncate text-right text-[12.5px] text-ink-2',
          mono && 'num',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
