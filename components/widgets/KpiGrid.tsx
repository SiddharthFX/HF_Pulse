'use client';

import { CalendarDays, Download, HardDrive, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCompact, formatPct } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import type { DerivedStats } from '@/types/hf';

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  detail: string;
  icon: typeof Download;
  index: number;
  glowClass: string;
  iconClass: string;
  dotClass: string;
};

export function KpiGrid({ stats }: { stats: DerivedStats }) {
  const lifetime = stats.totalDownloadsAllTime;
  const shareOfLifetime =
    lifetime.value > 0 ? stats.downloads30d / lifetime.value : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        index={0}
        label="Lifetime downloads"
        value={
          <>
            {formatCompact(lifetime.value)}
            {lifetime.isPartial ? (
              <span
                className="ml-0.5 align-super text-[13px] text-ink-3"
                title={`Lifetime data unavailable for ${lifetime.missingCount} repositories`}
              >
                *
              </span>
            ) : null}
          </>
        }
        detail="All-time total reported by the Hub"
        icon={Download}
        glowClass="bg-jade-300/20"
        iconClass="bg-jade-50 text-jade-700 ring-jade-600/5"
        dotClass="bg-jade-500"
      />
      <MetricCard
        index={1}
        label="Last 30 days"
        value={formatCompact(stats.downloads30d)}
        detail={
          shareOfLifetime === null
            ? 'Past 30-day download velocity'
            : `${formatPct(shareOfLifetime)} of lifetime downloads`
        }
        icon={CalendarDays}
        glowClass="bg-sky-400/20"
        iconClass="bg-sky-50 text-sky-700 ring-sky-700/5"
        dotClass="bg-sky-400"
      />
      <MetricCard
        index={2}
        label="Community likes"
        value={formatCompact(stats.totalLikes)}
        detail={`Across ${stats.repoCount.total} public ${stats.repoCount.total === 1 ? 'repository' : 'repositories'}`}
        icon={Heart}
        glowClass="bg-clay/20"
        iconClass="bg-clay-50 text-clay-700 ring-clay-700/5"
        dotClass="bg-clay"
      />
      <HostedAssetsKpiCard stats={stats} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  index,
  glowClass,
  iconClass,
  dotClass,
}: MetricCardProps) {
  return (
    <Card index={index} className="min-h-[170px] overflow-hidden p-0">
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-3xl',
          glowClass,
        )}
      />
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-jade-300/60 to-transparent" />
      <div className="relative flex min-h-[170px] flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            {label}
          </span>
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-[11px] ring-1',
              iconClass,
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </span>
        </div>
        <div className="mt-auto pt-7">
          <p className="num text-[34px] font-bold leading-none tracking-[-0.045em] text-ink">
            {value}
          </p>
          <p className="mt-3 flex items-center gap-2 text-[11.5px] leading-4 text-ink-3">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClass)} />
            {detail}
          </p>
        </div>
      </div>
    </Card>
  );
}

function HostedAssetsKpiCard({ stats }: { stats: DerivedStats }) {
  const models = stats.repoCount.models;
  const datasets = stats.repoCount.datasets;
  const total = stats.repoCount.total;
  const updatedRecent = stats.updatedLast30d;
  const modelRatio = total > 0 ? models / total : 0.5;

  return (
    <Card
      index={3}
      className="min-h-[170px] overflow-hidden border-jade-100 bg-[linear-gradient(145deg,var(--color-surface)_0%,var(--color-jade-50)_100%)] p-0 hover:border-jade-200"
      id="assets"
    >
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-jade-200/35 blur-3xl" />
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-jade-400/70 to-transparent" />
      <div className="relative flex min-h-[170px] flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            Hosted assets
          </span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[11px] border border-jade-100 bg-surface/80 text-jade-700 shadow-sm">
            <HardDrive aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </span>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-3">
            <p className="num text-[34px] font-bold leading-none tracking-[-0.045em] text-ink">
              {total}
            </p>
            <p className="pb-0.5 text-right text-[10.5px] leading-4 text-ink-3">
              {models} {models === 1 ? 'model' : 'models'}
              <br />
              {datasets} {datasets === 1 ? 'dataset' : 'datasets'}
            </p>
          </div>

          <div
            className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full border border-jade-100 bg-surface/75"
            role="progressbar"
            aria-valuenow={Math.round(modelRatio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Model versus dataset distribution"
          >
            <div
              className="h-full bg-jade-500 transition-all duration-300"
              style={{ width: `${modelRatio * 100}%` }}
              title={`Models: ${models}`}
            />
            <div
              className="h-full bg-clay transition-all duration-300"
              style={{ width: `${(1 - modelRatio) * 100}%` }}
              title={`Datasets: ${datasets}`}
            />
          </div>

          <p className="mt-2.5 flex items-center justify-between gap-3 text-[10.5px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-jade-500" />
              {updatedRecent > 0 ? `${updatedRecent} active in 30d` : 'All healthy'}
            </span>
            <span className="num font-semibold text-jade-700">
              {stats.avgDailyDownloads > 0
                ? `~${formatCompact(stats.avgDailyDownloads)}/day`
                : 'Active'}
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}
