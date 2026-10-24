'use client';

import { useMemo, useState } from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { formatCompact, formatPct } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/Card';
import { RangeSelect } from '@/components/ui/RangeSelect';
import { HATCH_IDS, HatchDefs, hatchUrl } from '@/components/ui/StripedFill';
import type { RepoView } from '@/types/hf';

type HealthWindow = '7d' | '30d' | '90d' | 'all';

const WINDOW_OPTIONS: ReadonlyArray<{ value: HealthWindow; label: string }> = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All-time' },
];

/**
 * Portfolio balance: model downloads as a share of all downloads across selected timeframe.
 * Interactively toggles between 7d, 30d, 90d, and all-time.
 */
export function RepoHealthGaugeCard({
  models = [],
  datasets = [],
  modelShare: initialModelShare,
  downloads30d: initialDownloads30d,
  avgDailyDownloads: initialAvgDaily,
  index = 0,
}: {
  models?: RepoView[];
  datasets?: RepoView[];
  modelShare?: number | null;
  downloads30d?: number;
  avgDailyDownloads?: number;
  index?: number;
}) {
  const [windowRange, setWindowRange] = useState<HealthWindow>('30d');

  const metrics = useMemo(() => {
    if (models.length === 0 && datasets.length === 0) {
      return {
        total: initialDownloads30d ?? 0,
        modelShare: initialModelShare ?? null,
        avgDaily: initialAvgDaily ?? 0,
        note: 'over the selected period',
      };
    }

    if (windowRange === '7d') {
      const m7 = models.reduce((a, r) => a + (r.downloads30d ? Math.round((r.downloads30d * 7) / 30) : 0), 0);
      const d7 = datasets.reduce((a, r) => a + (r.downloads30d ? Math.round((r.downloads30d * 7) / 30) : 0), 0);
      const total = m7 + d7;
      return {
        total,
        modelTotal: m7,
        datasetTotal: d7,
        modelShare: total > 0 ? m7 / total : null,
        avgDaily: Math.round(total / 7),
        note: `${formatCompact(Math.round(total / 7))}/day average over the last 7 days`,
      };
    }

    if (windowRange === '30d') {
      const m30 = models.reduce((a, r) => a + r.downloads30d, 0);
      const d30 = datasets.reduce((a, r) => a + r.downloads30d, 0);
      const total = m30 + d30;
      return {
        total,
        modelTotal: m30,
        datasetTotal: d30,
        modelShare: total > 0 ? m30 / total : null,
        avgDaily: Math.round(total / 30),
        note: `${formatCompact(Math.round(total / 30))}/day average over the last 30 days`,
      };
    }

    if (windowRange === '90d') {
      const m90 = models.reduce((a, r) => a + (r.downloads30d ? Math.min(r.downloadsAllTime ?? Infinity, Math.round(r.downloads30d * 3)) : 0), 0);
      const d90 = datasets.reduce((a, r) => a + (r.downloads30d ? Math.min(r.downloadsAllTime ?? Infinity, Math.round(r.downloads30d * 3)) : 0), 0);
      const total = m90 + d90;
      return {
        total,
        modelTotal: m90,
        datasetTotal: d90,
        modelShare: total > 0 ? m90 / total : null,
        avgDaily: Math.round(total / 90),
        note: `~${formatCompact(Math.round(total / 90))}/day projected over 90 days`,
      };
    }

    // all-time
    const mAll = models.reduce((a, r) => a + (r.downloadsAllTime ?? 0), 0);
    const dAll = datasets.reduce((a, r) => a + (r.downloadsAllTime ?? 0), 0);
    const total = mAll + dAll;
    const d30Total = models.reduce((a, r) => a + r.downloads30d, 0) + datasets.reduce((a, r) => a + r.downloads30d, 0);
    return {
      total,
      modelTotal: mAll,
      datasetTotal: dAll,
      modelShare: total > 0 ? mAll / total : null,
      avgDaily: Math.round(d30Total / 30),
      note: 'Lifetime download split across all public repositories',
    };
  }, [models, datasets, windowRange, initialDownloads30d, initialModelShare, initialAvgDaily]);

  const pct = metrics.modelShare === null ? 0 : Math.round(metrics.modelShare * 100);
  const datasetPct = metrics.modelShare === null ? 0 : 100 - pct;
  const data = [{ name: 'models', value: pct, fill: hatchUrl(HATCH_IDS.jade500) }];

  return (
    <Card index={index} className="flex flex-col p-5 sm:p-6">
      <CardHeader
        title="Portfolio balance"
        subtitle={windowRange === 'all' ? 'Lifetime distribution' : 'Selected window'}
        action={
          <RangeSelect
            label="Window"
            value={windowRange}
            options={WINDOW_OPTIONS}
            onChange={setWindowRange}
          />
        }
      />

      <p className="num font-display mt-4 text-[34px] font-semibold leading-none tracking-[-0.035em] text-ink">
        {formatCompact(metrics.total)}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-border-2" />
        {metrics.note}
      </p>

      <div className="relative mt-2 h-[150px] w-full">
        {metrics.modelShare === null ? (
          <p className="pt-10 text-center text-[12.5px] text-ink-3">
            No download data to split for this window.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={data}
                startAngle={200}
                endAngle={-20}
                innerRadius="62%"
                outerRadius="92%"
                barSize={22}
              >
                <HatchDefs />
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: 'var(--color-surface-2)' }}
                  dataKey="value"
                  cornerRadius={8}
                  angleAxisId={0}
                  isAnimationActive={false}
                />
              </RadialBarChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-3">
              <span className="num text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink">
                {pct}%
              </span>
              <span className="mt-1.5 text-[11.5px] text-ink-3">
                from models
              </span>
            </div>
          </>
        )}
      </div>

      {metrics.modelShare !== null ? (
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-[3px] bg-jade-500"
            />
            <span className="text-[12px] text-ink-2">Models</span>
            <span className="num text-[12px] font-semibold text-ink">
              {pct}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-[3px] bg-surface-3"
            />
            <span className="text-[12px] text-ink-2">Datasets</span>
            <span className="num text-[12px] font-semibold text-ink">
              {datasetPct}%
            </span>
          </div>
        </div>
      ) : null}

      <p className="sr-only-table">
        {metrics.modelShare === null
          ? 'Model versus dataset split unavailable.'
          : `Models account for ${formatPct(metrics.modelShare)} of downloads in this period.`}
      </p>
    </Card>
  );
}
