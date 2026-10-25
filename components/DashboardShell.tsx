'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Clock, ExternalLink, Layers, X } from 'lucide-react';
import {
  LS_KEYS,
  ORG_DISPLAY_NAME,
  ORG_URL,
  STALE_AFTER_MS,
} from '@/lib/constants';
import { formatRelativeDate } from '@/lib/format';
import { deriveStats } from '@/lib/hf/derive';
import {
  ShellProvider,
  useSectionObserver,
  usePersistentState,
} from '@/components/shell/ShellContext';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { RepoConfirmDialog } from '@/components/RepoConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { ErrorState } from '@/components/ui/EmptyState';
import { DownloadsOverviewCard } from '@/components/widgets/DownloadsOverviewCard';
import { KpiGrid } from '@/components/widgets/KpiGrid';
import { DownloadDistributionCard } from '@/components/widgets/DownloadDistributionCard';
import { TopReposCard } from '@/components/widgets/TopReposCard';
import { RecentActivityCard } from '@/components/widgets/RecentActivityCard';
import { InsightCard } from '@/components/widgets/InsightCard';
import { RepoHealthGaugeCard } from '@/components/widgets/RepoHealthGaugeCard';
import { ModelsSection } from '@/components/widgets/ModelsSection';
import { DatasetsSection } from '@/components/widgets/DatasetsSection';
import { PromoCard } from '@/components/widgets/PromoCard';
import { cn } from '@/lib/cn';
import type { DashboardPayload } from '@/types/hf';

const SECTION_IDS = ['overview', 'activity', 'models', 'datasets'] as const;

export function DashboardShell({ payload }: { payload: DashboardPayload }) {
  const repos = useMemo(
    () => [...payload.models, ...payload.datasets],
    [payload.models, payload.datasets],
  );

  return (
    <ShellProvider repos={repos}>
      <ShellBody payload={payload} />
      <RepoConfirmDialog />
    </ShellProvider>
  );
}

function ShellBody({ payload }: { payload: DashboardPayload }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTriggerRef = useRef<HTMLElement | null>(null);
  const openDrawer = useCallback((trigger?: HTMLElement | null) => {
    drawerTriggerRef.current =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [promoDismissed, setPromoDismissed] = usePersistentState<boolean>(
    LS_KEYS.promoDismissed,
    false,
  );

  useSectionObserver(SECTION_IDS, mainContentRef);

  const stats = useMemo(
    () => deriveStats(payload.models, payload.datasets),
    [payload.models, payload.datasets],
  );
  const [, setPrefsRevision] = useState(0);

  useEffect(() => {
    const onPrefsChange = () => setPrefsRevision((revision) => revision + 1);
    window.addEventListener('pluto:prefs', onPrefsChange);
    return () => window.removeEventListener('pluto:prefs', onPrefsChange);
  }, []);

  const repos = useMemo(
    () => [...payload.models, ...payload.datasets],
    [payload.models, payload.datasets],
  );

  const totalFailure =
    payload.modelsError !== null &&
    payload.datasetsError !== null &&
    repos.length === 0;

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        returnFocus={drawerTriggerRef.current}
      >
        <Sidebar
          datasetCount={payload.datasets.length}
          variant="drawer"
          onNavigate={() => setDrawerOpen(false)}
        />
      </MobileDrawer>

      <div data-dashboard-scroll className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        {/* Floating header pill */}
        <header className="relative z-30 shrink-0 px-2.5 pt-2.5 sm:px-4 sm:pt-4 lg:px-5">
          <div className="mx-auto w-full max-w-[1720px] rounded-[26px] border border-border/70 bg-surface/90 shadow-[0_1px_2px_rgba(26,31,27,.04),0_16px_40px_-32px_rgba(26,31,27,.45)] backdrop-blur-xl dark:border-border">
            <Topbar payload={payload} onOpenDrawer={openDrawer} />
          </div>
        </header>

        <div
          ref={mainContentRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        >
          <div className="mx-auto flex w-full max-w-[1720px] gap-5 px-2.5 sm:px-4 lg:px-5">
            {/* Floating icon rail */}
            <div className="sticky top-0 z-20 hidden h-[calc(100dvh-82px)] w-[60px] shrink-0 py-5 md:block">
              <Sidebar datasetCount={payload.datasets.length} />
            </div>

            <main className="min-w-0 flex-1 pb-14 pt-5 sm:pt-6">
              <FixtureBanner active={payload.isFixture} />
              <StaleRibbon fetchedAt={payload.fetchedAt} />

              <Greeting
                fetchedAt={payload.fetchedAt}
                total={stats.repoCount.total}
                models={stats.repoCount.models}
                datasets={stats.repoCount.datasets}
              />

              {totalFailure ? (
                <ErrorState
                  className="rounded-[var(--radius-card)] border border-border bg-surface"
                  message="Hugging Face data could not be loaded."
                  detail={
                    payload.modelsError?.kind === 'rate_limit' ||
                    payload.datasetsError?.kind === 'rate_limit'
                      ? 'The Hub rate limit was reached. Data refreshes automatically every 12 hours; you can also retry with the refresh button in the header. Setting HF_TOKEN raises the limit.'
                      : (payload.modelsError?.error ?? payload.datasetsError?.error)
                  }
                />
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  <section id="overview" className="scroll-mt-6" aria-label="Key Performance Indicators">
                    <KpiGrid stats={stats} />
                  </section>

                  <section className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12 [&>*>*]:h-full">
                    <div className="xl:col-span-8">
                      <DownloadsOverviewCard
                        repos={repos}
                        totalLifetime={stats.totalDownloadsAllTime.value}
                        isPartial={stats.totalDownloadsAllTime.isPartial}
                        missingCount={stats.totalDownloadsAllTime.missingCount}
                        snapshots={payload.snapshots}
                        canShowTrend={payload.canShowTrend}
                        index={1}
                      />
                    </div>
                    <div className="xl:col-span-4">
                      <DownloadDistributionCard
                        models={payload.models}
                        datasets={payload.datasets}
                        index={2}
                      />
                    </div>
                  </section>

                  <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 [&>*>*]:h-full">
                    <div className={cn('lg:col-span-7', !promoDismissed && 'xl:col-span-5')}>
                      <InsightCard stats={stats} index={3} />
                    </div>
                    <div className={cn('lg:col-span-5', !promoDismissed && 'xl:col-span-4')}>
                      <RepoHealthGaugeCard
                        models={payload.models}
                        datasets={payload.datasets}
                        downloads30d={stats.downloads30d}
                        modelShare={stats.modelVsDatasetShare}
                        avgDailyDownloads={stats.avgDailyDownloads}
                        index={4}
                      />
                    </div>
                    {!promoDismissed ? (
                      <div className="lg:col-span-12 xl:col-span-3">
                        <PromoCard onDismiss={() => setPromoDismissed(true)} index={5} />
                      </div>
                    ) : null}
                  </section>

                  <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 [&>*>*]:h-full">
                    <div>
                      <TopReposCard
                        models={stats.topModels}
                        datasets={stats.topDatasets}
                        rawModels={payload.models}
                        rawDatasets={payload.datasets}
                        index={5}
                      />
                    </div>
                    <div id="activity" className="scroll-mt-6">
                      <RecentActivityCard repos={repos} index={6} />
                    </div>
                  </section>

                  <div className="space-y-4 pt-1 sm:space-y-5">
                    <ModelsSection
                      models={payload.models}
                      error={payload.modelsError}
                      index={7}
                    />
                    <DatasetsSection
                      datasets={payload.datasets}
                      error={payload.datasetsError}
                      index={8}
                    />
                  </div>
                </div>
              )}

              <Footnotes fetchedAt={payload.fetchedAt} />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Replaces the old hero banner — reference's "Welcome Back, Name" row. */
function Greeting({
  fetchedAt,
  total,
  models,
  datasets,
}: {
  fetchedAt: string;
  total: number;
  models: number;
  datasets: number;
}) {
  return (
    <section
      aria-labelledby="dashboard-title"
      className="mb-5 flex flex-col gap-4 sm:mb-6 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="min-w-0 animate-[card-in_420ms_cubic-bezier(.2,.8,.2,1)_both]">
        <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-jade-200/70 bg-jade-50 px-2.5 py-1 text-jade-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400 opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-jade-500" />
            </span>
            Public Hub snapshot
          </span>
          <span className="text-ink-3">Refreshes every 12 hours</span>
        </div>
        <h1
          id="dashboard-title"
          className="text-[30px] font-medium leading-[1.05] tracking-[-0.035em] text-ink sm:text-[40px] xl:text-[44px]"
        >
          Welcome back, <span className="text-ink-3">{ORG_DISPLAY_NAME}</span>
        </h1>
        <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-ink-2 sm:text-[14px]">
          A focused view of every public model, dataset, and download across your research portfolio.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <span
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-surface px-4 text-[12.5px] font-medium text-ink-2 dark:border-border"
          suppressHydrationWarning
        >
          <Clock aria-hidden="true" className="h-4 w-4 text-jade-600" strokeWidth={1.8} />
          Last fetched {formatRelativeDate(fetchedAt)}
        </span>
        <span className="inline-flex h-11 items-center gap-1 rounded-full border border-border/70 bg-surface py-1 pl-1.5 pr-1.5 text-[12.5px] dark:border-border">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-jade-50 text-jade-700">
            <Layers aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <HeroMetric value={total} label={total === 1 ? 'Repository' : 'Repositories'} />
          <span aria-hidden="true" className="h-4 w-px bg-border" />
          <HeroMetric value={models} label="Models" />
          <span aria-hidden="true" className="h-4 w-px bg-border" />
          <HeroMetric value={datasets} label="Datasets" />
        </span>
        <a
          href={ORG_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-action px-5 text-[13px] font-semibold text-on-action shadow-[0_12px_24px_-14px_color-mix(in_srgb,var(--color-action)_95%,transparent)] transition-[background-color,transform] hover:bg-action-hover active:scale-[.98] sm:w-auto"
        >
          Open on Hugging Face
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      </div>
    </section>
  );
}

function HeroMetric({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 px-2">
      <span className="num font-display text-[15px] font-semibold text-ink">{value}</span>
      <span className="text-[11.5px] font-medium text-ink-3">{label}</span>
    </span>
  );
}

function MobileDrawer({
  open,
  onClose,
  returnFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const scrollContainer = document.querySelector<HTMLElement>('[data-dashboard-scroll]');
    const previousBodyOverflow = document.body.style.overflow;
    const previousScrollOverflow = scrollContainer?.style.overflow ?? '';
    const previousInert = scrollContainer?.getAttribute('inert') ?? null;
    const previousAriaHidden = scrollContainer?.getAttribute('aria-hidden') ?? null;

    document.body.style.overflow = 'hidden';
    if (scrollContainer) {
      scrollContainer.style.overflow = 'hidden';
      scrollContainer.setAttribute('inert', '');
      scrollContainer.setAttribute('aria-hidden', 'true');
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !overlayRef.current) return;
      const focusable = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!overlayRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousBodyOverflow;
      if (scrollContainer) {
        scrollContainer.style.overflow = previousScrollOverflow;
        if (previousInert === null) scrollContainer.removeAttribute('inert');
        else scrollContainer.setAttribute('inert', previousInert);
        if (previousAriaHidden === null) scrollContainer.removeAttribute('aria-hidden');
        else scrollContainer.setAttribute('aria-hidden', previousAriaHidden);
      }
      if (opener && document.contains(opener)) requestAnimationFrame(() => opener.focus());
    };
  }, [onClose, open, returnFocus]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[#141a16]/35 backdrop-blur-sm animate-[overlay-in_180ms_ease-out_both] motion-reduce:animate-none"
      />
      <div className="absolute left-0 top-0 h-full w-[min(290px,calc(100vw-64px))] animate-[drawer-in_240ms_cubic-bezier(.2,.8,.2,1)_both] motion-reduce:animate-none">
        {children}
      </div>
      <IconButton
        ref={closeRef}
        aria-label="Close navigation"
        size={44}
        onClick={onClose}
        className="absolute right-3 top-3.5 border-border bg-surface shadow-xl"
      >
        <X aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </IconButton>
    </div>
  );
}

function FixtureBanner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-[20px] border border-clay/35 bg-clay-50 px-4 py-3.5"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/70">
        <AlertTriangle
          aria-hidden="true"
          className="h-4 w-4 text-clay-700"
          strokeWidth={1.9}
        />
      </span>
      <p className="pt-1 text-[12.5px] leading-[1.5] text-clay-700">
        <strong className="font-bold">FIXTURE DATA — not real.</strong> This
        render is using local development fixtures because{' '}
        <code className="num rounded-md bg-surface/70 px-1.5 py-0.5">HF_FIXTURES=1</code> is set. Unset it to read live
        Hugging Face data.
      </p>
    </div>
  );
}

function StaleRibbon({ fetchedAt }: { fetchedAt: string }) {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const at = Date.parse(fetchedAt);
    if (Number.isNaN(at)) return;
    const check = () => setStale(Date.now() - at > STALE_AFTER_MS);
    check();
    const remaining = STALE_AFTER_MS - (Date.now() - at);
    if (remaining <= 0) return;
    const timer = window.setTimeout(check, remaining + 1000);
    return () => window.clearTimeout(timer);
  }, [fetchedAt]);

  if (!stale) return null;

  return (
    <div
      role="status"
      className="mb-5 flex items-center gap-3 rounded-[20px] border border-border bg-surface px-4 py-3"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2">
        <Clock aria-hidden="true" className="h-4 w-4 text-ink-3" strokeWidth={1.8} />
      </span>
      <p className="text-[12.5px] leading-5 text-ink-2">
        Showing data fetched {formatRelativeDate(fetchedAt)}. The next automatic
        refresh is overdue — use the refresh button to fetch now.
      </p>
    </div>
  );
}

function Footnotes({ fetchedAt }: { fetchedAt: string }) {
  return (
    <footer className="mt-8 rounded-[20px] border border-border/70 bg-surface/70 px-5 py-4 dark:border-border">
      <p className="text-[11px] leading-[1.6] text-ink-3">
        All figures come from the public Hugging Face Hub API.{' '}
        <strong className="font-semibold text-ink-2">Lifetime</strong> and{' '}
        <strong className="font-semibold text-ink-2">30-day</strong> download counts
        are reported directly by the Hub; the API exposes no per-day history, so
        this dashboard shows no daily time series. An asterisk marks a total that
        omits repositories where the Hub did not return that field. Data refreshes
        automatically every 12 hours — last fetched{' '}
        <time dateTime={fetchedAt} suppressHydrationWarning>{formatRelativeDate(fetchedAt)}</time>.
      </p>
    </footer>
  );
}
