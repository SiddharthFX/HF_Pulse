'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Clock, ExternalLink, X } from 'lucide-react';
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
  const [collapsed, setCollapsed] = usePersistentState<boolean>(
    LS_KEYS.sidebarCollapsed,
    false,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTriggerRef = useRef<HTMLElement | null>(null);
  const openDrawer = useCallback((trigger?: HTMLElement | null) => {
    drawerTriggerRef.current =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const mainContentRef = useRef<HTMLDivElement>(null);

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
    <div className="flex h-dvh w-full overflow-hidden bg-page">
      <div className="hidden h-dvh shrink-0 md:block">
        <Sidebar
          datasetCount={payload.datasets.length}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        returnFocus={drawerTriggerRef.current}
      >
        <Sidebar
          datasetCount={payload.datasets.length}
          collapsed={false}
          onCollapsedChange={() => undefined}
          variant="drawer"
          onNavigate={() => setDrawerOpen(false)}
        />
      </MobileDrawer>

      <div
        ref={mainContentRef}
        data-dashboard-scroll
        className="flex h-dvh min-w-0 flex-1 flex-col overflow-y-auto"
      >
        <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/80 shadow-[0_1px_0_rgba(127,148,135,.12)] backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[1600px]">
            <Topbar payload={payload} onOpenDrawer={openDrawer} />
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1600px] px-4 pb-14 pt-6 md:px-7 xl:px-8">
            <FixtureBanner active={payload.isFixture} />
            <StaleRibbon fetchedAt={payload.fetchedAt} />

            <section className="relative mb-6 overflow-hidden rounded-[26px] border border-jade-100 bg-[radial-gradient(ellipse_at_top_right,var(--color-jade-50)_0%,var(--color-surface)_72%)] shadow-[0_20px_60px_-42px_rgba(10,92,65,.65)] dark:bg-[radial-gradient(ellipse_at_top_right,var(--color-jade-100)_0%,var(--color-surface)_65%)] sm:rounded-[30px]">
              <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-jade-200/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-36 left-[28%] h-72 w-72 rounded-full bg-jade-100/50 blur-3xl" />
              <div className="pointer-events-none absolute inset-y-0 right-[32%] hidden w-px bg-gradient-to-b from-transparent via-jade-200/60 to-transparent lg:block" />

              <div className="relative grid gap-7 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8 lg:py-8">
                <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                  <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-jade-100 bg-white shadow-[0_16px_34px_-20px_rgba(10,92,65,.65)] dark:bg-surface-2 sm:h-[72px] sm:w-[72px] sm:rounded-[22px]">
                    <Image
                      src="/pluto-logo.webp"
                      alt={`${ORG_DISPLAY_NAME} logo`}
                      width={72}
                      height={72}
                      className="h-[58px] w-[58px] object-contain dark:hidden sm:h-[64px] sm:w-[64px]"
                      priority
                    />
                    <Image
                      src="/pluto-logo-dark.webp"
                      alt=""
                      width={72}
                      height={72}
                      className="hidden h-[58px] w-[58px] object-contain dark:block sm:h-[64px] sm:w-[64px]"
                      priority
                    />
                  </span>
                  <div className="min-w-0">
                    <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.15em] text-jade-700">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-jade-100 bg-jade-50 px-2.5 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-jade-500" />
                        Public Hub snapshot
                      </span>
                      <span className="text-ink-3">Refreshes every 12 hours</span>
                    </div>
                    <h1 className="text-[31px] font-bold leading-[1.04] tracking-[-0.045em] text-ink sm:text-[38px]">
                      {ORG_DISPLAY_NAME}
                    </h1>
                    <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-ink-2 sm:text-[13.5px]">
                      A focused view of every public model, dataset, and download across your research portfolio.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-jade-100 pt-5 sm:flex-row sm:items-center lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <div className="grid min-w-0 flex-1 grid-cols-3 divide-x divide-jade-100 rounded-[18px] border border-jade-100 bg-surface-2 px-2 py-3 sm:min-w-[300px]">
                    <HeroMetric
                      value={stats.repoCount.total}
                      label={stats.repoCount.total === 1 ? 'Repository' : 'Repositories'}
                    />
                    <HeroMetric value={stats.repoCount.models} label="Models" />
                    <HeroMetric value={stats.repoCount.datasets} label="Datasets" />
                  </div>
                  <a
                    href={ORG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[13px] bg-action px-4 text-[12.5px] font-bold text-on-action shadow-[0_12px_24px_-14px_rgba(18,173,118,.95)] transition-[background-color,transform] hover:bg-action-hover active:scale-[.98]"
                  >
                    Open on Hugging Face
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
                  </a>
                </div>
              </div>

              <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-jade-100/80 bg-surface-2/70 px-5 py-3 text-[10.5px] text-ink-3 sm:px-7 lg:px-8">
                <span className="flex items-center gap-1.5" suppressHydrationWarning>
                  <Clock aria-hidden="true" className="h-3.5 w-3.5 text-jade-600" strokeWidth={1.8} />
                  Last fetched {formatRelativeDate(payload.fetchedAt)}
                </span>
                <span className="hidden h-3 w-px bg-jade-100 sm:block" />
                <span>Data sourced directly from public Hugging Face Hub endpoints</span>
              </div>
            </section>

            {totalFailure ? (
              <ErrorState
                message="Hugging Face data could not be loaded."
                detail={
                  payload.modelsError?.kind === 'rate_limit' ||
                  payload.datasetsError?.kind === 'rate_limit'
                    ? 'The Hub rate limit was reached. Data refreshes automatically every 12 hours; you can also retry with the refresh button in the header. Setting HF_TOKEN raises the limit.'
                    : (payload.modelsError?.error ?? payload.datasetsError?.error)
                }
              />
            ) : (
              <div className="space-y-5">
                <section id="overview" className="scroll-mt-[88px]" aria-label="Key Performance Indicators">
                  <KpiGrid stats={stats} />
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-12 [&>*>*]:h-full">
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

                <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 [&>*>*]:h-full">
                  <div className="lg:col-span-7">
                    <InsightCard stats={stats} index={3} />
                  </div>
                  <div className="lg:col-span-5">
                    <RepoHealthGaugeCard
                      models={payload.models}
                      datasets={payload.datasets}
                      downloads30d={stats.downloads30d}
                      modelShare={stats.modelVsDatasetShare}
                      avgDailyDownloads={stats.avgDailyDownloads}
                      index={4}
                    />
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 [&>*>*]:h-full">
                  <div>
                    <TopReposCard
                      models={stats.topModels}
                      datasets={stats.topDatasets}
                      rawModels={payload.models}
                      rawDatasets={payload.datasets}
                      index={5}
                    />
                  </div>
                  <div id="activity" className="scroll-mt-[88px]">
                    <RecentActivityCard repos={repos} index={6} />
                  </div>
                </section>

                <div className="space-y-5 pt-1">
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
          </div>
        </main>
      </div>
    </div>
  );
}

function HeroMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 px-3 text-center sm:px-4">
      <p className="num text-[18px] font-bold leading-none tracking-[-0.035em] text-ink sm:text-[20px]">
        {value}
      </p>
      <p className="mt-1.5 truncate text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
        {label}
      </p>
    </div>
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
        className="absolute inset-0 bg-[#183128]/25 backdrop-blur-sm animate-[overlay-in_180ms_ease-out_both] motion-reduce:animate-none"
      />
      <div className="absolute left-0 top-0 h-full w-[260px] animate-[panel-in_220ms_cubic-bezier(.2,.8,.2,1)_both] motion-reduce:animate-none">
        {children}
      </div>
      <IconButton
        ref={closeRef}
        aria-label="Close navigation"
        size={44}
        onClick={onClose}
        className="absolute left-[276px] top-4 border-border bg-surface shadow-xl"
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
      className="mb-5 flex items-start gap-3 rounded-[16px] border border-clay/35 bg-clay-50 px-4 py-3.5 shadow-[0_10px_30px_-24px_rgba(154,86,37,.7)]"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mt-px h-[18px] w-[18px] shrink-0 text-clay-700"
        strokeWidth={1.9}
      />
      <p className="text-[12.5px] leading-[1.5] text-clay-700">
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
      className="mb-5 flex items-center gap-3 rounded-[16px] border border-border bg-surface px-4 py-3.5 shadow-sm"
    >
      <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} />
      <p className="text-[12.5px] leading-5 text-ink-2">
        Showing data fetched {formatRelativeDate(fetchedAt)}. The next automatic
        refresh is overdue — use the refresh button to fetch now.
      </p>
    </div>
  );
}

function Footnotes({ fetchedAt }: { fetchedAt: string }) {
  return (
    <footer className="mt-8 rounded-[18px] border border-border bg-surface/80 px-5 py-4 shadow-[0_10px_30px_-28px_rgba(19,32,25,.55)]">
      <p className="text-[11px] leading-[1.55] text-ink-3">
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
