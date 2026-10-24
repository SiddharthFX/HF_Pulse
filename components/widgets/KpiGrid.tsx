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
    <Card index={index} className="group min-h-[164px] overflow-hidden p-0">
      <div
        className={cn(
          'pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-100',
          glowClass,
        )}
      />
      <div className="relative flex min-h-[164px] flex-col p-5">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-300 group-hover:scale-105',
              iconClass,
            )}
          >
            <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </span>
          <span className="text-[13px] font-medium text-ink-2">{label}</span>
        </div>
        <div className="mt-auto pt-6">
          <p className="num font-display text-[34px] font-semibold leading-none tracking-[-0.035em] text-ink">
            {value}
          </p>
          <p className="mt-2.5 flex items-center gap-2 text-[11.5px] leading-4 text-ink-3">
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
      className="sage-gradient group min-h-[164px] overflow-hidden border-transparent p-0 dark:border-jade-200/40"
      id="assets"
    >
      <div className="hatch-soft pointer-events-none absolute inset-0 opacity-60" />
      <svg
        aria-hidden="true"
        viewBox="0 0 120 60"
        className="pointer-events-none absolute right-4 top-5 h-12 w-24 text-white/55 transition-transform duration-500 group-hover:translate-x-1"
        fill="none"
      >
        <path
          d="M2 50 C 22 50, 26 12, 46 12 S 70 46, 86 40 S 108 10, 118 8"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className="relative flex min-h-[164px] flex-col p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
            <HardDrive aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </span>
          <span className="text-[13px] font-medium text-white/85">Hosted assets</span>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3">
            <p className="num font-display text-[34px] font-semibold leading-none tracking-[-0.035em] text-white">
              {total}
            </p>
            <p className="pb-0.5 text-right text-[11px] leading-4 text-white/75">
              {models} {models === 1 ? 'model' : 'models'}
              <br />
              {datasets} {datasets === 1 ? 'dataset' : 'datasets'}
            </p>
          </div>

          <div
            className="mt-3 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-valuenow={Math.round(modelRatio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Model versus dataset distribution"
          >
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${modelRatio * 100}%` }}
              title={`Models: ${models}`}
            />
            <div
              className="h-full rounded-full bg-[#f2c99a] transition-all duration-300"
              style={{ width: `${(1 - modelRatio) * 100}%` }}
              title={`Datasets: ${datasets}`}
            />
          </div>

          <p className="mt-2.5 flex items-center justify-between gap-3 text-[11px] text-white/75">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {updatedRecent > 0 ? `${updatedRecent} active in 30d` : 'All healthy'}
            </span>
            <span className="num font-semibold text-white">
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
