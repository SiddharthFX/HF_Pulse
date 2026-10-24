'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineIcon,
  Mountain,
  MountainSnow,
} from 'lucide-react';
import { formatCompact, formatFull, truncate } from '@/lib/format';
import { LS_KEYS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { useShell } from '@/components/shell/ShellContext';
import type { RepoView, Snapshot } from '@/types/hf';

type Mode = 'lifetime' | '30d' | '7d' | 'both';
type Tab = 'repos' | 'trend';
type ChartStyle = 'mountain' | 'peaks' | 'bars';

const MODE_OPTIONS: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'lifetime', label: 'Lifetime' },
  { value: '30d', label: '30-day' },
  { value: '7d', label: '7-day' },
  { value: 'both', label: 'All Series' },
];

interface Row {
  name: string;
  short: string;
  lifetime: number | null;
  d30: number;
  d7: number;
  likes: number;
  repo: RepoView;
}

export function DownloadsOverviewCard({
  repos,
  totalLifetime,
  isPartial,
  missingCount,
  snapshots,
  canShowTrend,
  index = 0,
}: {
  repos: RepoView[];
  totalLifetime: number;
  isPartial: boolean;
  missingCount: number;
  snapshots: Snapshot[];
  canShowTrend: boolean;
  index?: number;
}) {
  const { openRepo } = useShell();
  const [tab, setTab] = useState<Tab>('repos');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('mountain');
  const [mode, setMode] = useState<Mode>('lifetime');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [logScale, setLogScale] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(LS_KEYS.logScale);
      if (stored !== null) setLogScale(JSON.parse(stored) === true);
    } catch {}

    const onPrefs = (e: Event) => {
      const detail = (e as CustomEvent<{ logScale: boolean }>).detail;
      if (detail && typeof detail.logScale === 'boolean') setLogScale(detail.logScale);
    };
    window.addEventListener('pluto:prefs', onPrefs);
    return () => window.removeEventListener('pluto:prefs', onPrefs);
  }, []);

  const total30d = useMemo(
    () => repos.reduce((acc, r) => acc + (r.downloads30d ?? 0), 0),
    [repos],
  );

  const total7d = useMemo(
    () =>
      repos.reduce(
        (acc, r) => acc + Math.round((r.downloads30d ?? 0) * (7 / 30)),
        0,
      ),
    [repos],
  );

  const displayTotal =
    mode === '30d'
      ? total30d
      : mode === '7d'
        ? total7d
        : totalLifetime;

  const displayLabel =
    tab === 'trend'
      ? 'Observed Trend'
      : mode === '30d'
        ? 'Last 30 days downloads'
        : mode === '7d'
          ? 'Last 7 days downloads (estimated)'
          : mode === 'both'
            ? 'All-time lifetime & velocity overview'
            : 'Lifetime downloads overview';

  const rows = useMemo<Row[]>(
    () => {
      const sorted = [...repos].sort((a, b) => {
        if (mode === '30d') return b.downloads30d - a.downloads30d;
        if (mode === '7d') return b.downloads30d - a.downloads30d;
        return (b.downloadsAllTime ?? 0) - (a.downloadsAllTime ?? 0);
      });

      return sorted.slice(0, 10).map((repo) => {
        const rawLt = repo.downloadsAllTime;
        const raw30 = repo.downloads30d;
        const raw7 = Math.round(repo.downloads30d * (7 / 30));
        const rawLikes = repo.likes;

        return {
          name: repo.name,
          short: truncate(repo.name, 9),
          // When log scale is active, floor <=0 values to 0.5 to prevent log(0) NaN rendering
          lifetime: logScale && (rawLt === null || rawLt <= 0) ? 0.5 : rawLt,
          d30: logScale && raw30 <= 0 ? 0.5 : raw30,
          d7: logScale && raw7 <= 0 ? 0.5 : raw7,
          likes: logScale && rawLikes <= 0 ? 0.5 : rawLikes,
          repo,
        };
      });
    },
    [repos, mode, logScale],
  );

  const summitRepo = useMemo(() => {
    if (rows.length === 0) return null;
    if (mode === '30d') {
      const top = [...rows].sort((a, b) => b.d30 - a.d30)[0];
      return top ? { name: top.name, value: top.d30, unit: 'in 30d' } : null;
    }
    if (mode === '7d') {
      const top = [...rows].sort((a, b) => b.d7 - a.d7)[0];
      return top ? { name: top.name, value: top.d7, unit: 'in 7d' } : null;
    }
    const top = [...rows].sort((a, b) => (b.lifetime ?? 0) - (a.lifetime ?? 0))[0];
    return top ? { name: top.name, value: top.lifetime ?? 0, unit: 'all-time' } : null;
  }, [rows, mode]);

  const summitLeader =
    mode === '30d'
      ? Math.max(...rows.map((r) => r.d30), 1)
      : mode === '7d'
        ? Math.max(...rows.map((r) => r.d7), 1)
        : Math.max(...rows.map((r) => r.lifetime ?? 0), 1);

  return (
    <Card index={index} className="flex flex-col p-5 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <p className="num font-display text-[clamp(32px,3vw,44px)] font-semibold leading-none tracking-[-0.035em] text-ink transition-all duration-200">
              {formatCompact(displayTotal)}
              {isPartial && (mode === 'lifetime' || mode === 'both') ? (
                <span
                  className="ml-1 align-super text-[16px] text-ink-3"
                  title={`Lifetime data unavailable for ${missingCount} ${
                    missingCount === 1 ? 'repository' : 'repositories'
                  }`}
                >
                  *
                </span>
              ) : null}
            </p>

            {summitRepo && (
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-jade-200/70 bg-jade-50 px-3 py-1 text-[11.5px] font-medium text-jade-900 transition-all duration-200">
                <Mountain className="h-3.5 w-3.5 text-jade-600" />
                <span>
                  Peak: <strong>{summitRepo.name}</strong> ({formatCompact(summitRepo.value)})
                </span>
              </div>
            )}
          </div>

          <p className="mt-2 text-[13px] font-medium text-ink-3 transition-colors duration-200">
            {displayLabel}
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end w-full sm:w-auto gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Mode Filter */}
            {tab === 'repos' ? (
              <div className="seg">
                {MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    aria-pressed={mode === option.value}
                    className="seg-item"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Chart Style Switchers */}
            <div className="seg">
              {tab === 'repos' ? (
                <>
                  <TabButton
                    active={chartStyle === 'mountain'}
                    label="Mountain Ridge View"
                    onClick={() => setChartStyle('mountain')}
                  >
                    <Mountain aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </TabButton>
                  <TabButton
                    active={chartStyle === 'peaks'}
                    label="Mountain Peaks View"
                    onClick={() => setChartStyle('peaks')}
                  >
                    <MountainSnow aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </TabButton>
                  <TabButton
                    active={chartStyle === 'bars'}
                    label="Bar Elevation View"
                    onClick={() => setChartStyle('bars')}
                  >
                    <BarChart3 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </TabButton>
                </>
              ) : null}

              <TabButton
                active={tab === 'trend'}
                label="Observed trend"
                onClick={() => {
                  if (tab === 'trend') {
                    setTab('repos');
                  } else if (canShowTrend) {
                    setTab('trend');
                  }
                }}
                disabled={!canShowTrend && tab !== 'trend'}
                title={
                  canShowTrend ? 'Observed trend' : 'Needs at least 3 observations'
                }
              >
                <LineIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </TabButton>
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
            {mode === 'lifetime' && (
              <LegendDot color="var(--color-chart-1)" label="Lifetime Peak" />
            )}
            {mode === '30d' && (
              <LegendDot color="var(--color-chart-2)" label="30-day Velocity" />
            )}
            {mode === '7d' && (
              <LegendDot color="var(--color-chart-4)" label="7-day Trend" />
            )}
            {mode === 'both' && (
              <>
                <LegendDot color="var(--color-chart-1)" label="Lifetime" />
                <LegendDot color="var(--color-chart-2)" label="30-day" />
                <LegendDot color="var(--color-chart-3)" label="Likes" />
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mt-1 text-[12px] text-ink-3">
        {tab === 'repos'
          ? mode === 'lifetime'
            ? 'Lifetime download mountain peaks across leading repositories.'
            : mode === '30d'
              ? '30-day velocity elevation across leading repositories.'
              : mode === '7d'
                ? 'Recent 7-day download momentum across leading repositories.'
                : 'Layered mountain elevation silhouette comparing lifetime downloads, 30-day velocity, and likes.'
          : 'Sampled since this server instance started — not historical Hub data. Resets on redeploy.'}
      </p>

      {/* Main Chart Canvas */}
      <div className="mt-4 h-[210px] sm:h-[240px] w-full">
        {!mounted ? (
          <div className="h-full w-full rounded-[var(--radius-inner)] bg-surface-2 animate-pulse" />
        ) : tab === 'repos' ? (
          chartStyle === 'bars' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                barCategoryGap="22%"
                margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                onMouseMove={(state) => {
                  const next =
                    typeof state.activeTooltipIndex === 'number'
                      ? state.activeTooltipIndex
                      : null;
                  setActiveIndex(next);
                }}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <defs>
                  <linearGradient id="barGradLifetime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" />
                    <stop offset="100%" stopColor="var(--color-jade-600)" />
                  </linearGradient>
                  <linearGradient id="barGrad30d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" />
                    <stop offset="100%" stopColor="var(--color-chart-2)" />
                  </linearGradient>
                  <linearGradient id="barGrad7d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-4)" />
                    <stop offset="100%" stopColor="var(--color-chart-4)" />
                  </linearGradient>
                  <linearGradient id="barGradLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-3)" />
                    <stop offset="100%" stopColor="var(--color-chart-3)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="short"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
                  tickCount={5}
                  scale={logScale ? 'log' : 'auto'}
                  domain={logScale ? [0.5, 'auto'] : [0, 'auto']}
                  allowDataOverflow={false}
                  tickFormatter={(v: number) => (v < 1 ? '0' : formatCompact(v))}
                />
                <Tooltip
                  cursor={{ fill: 'color-mix(in srgb, var(--color-jade-400) 10%, transparent)' }}
                  content={
                    <MountainTooltip
                      activeMode={mode}
                      summitLeader={summitLeader}
                    />
                  }
                />

                {(mode === 'lifetime' || mode === 'both') && (
                  <Bar
                    dataKey="lifetime"
                    name="Lifetime"
                    minPointSize={4}
                    radius={[10, 10, 4, 4]}
                    fill="url(#barGradLifetime)"
                    isAnimationActive={false}
                    onClick={(_, i) => {
                      const row = rows[i];
                      if (row) openRepo(row.repo);
                    }}
                  >
                    {rows.map((row, i) => (
                      <Cell
                        key={row.name}
                        cursor="pointer"
                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                )}

                {(mode === '30d' || mode === 'both') && (
                  <Bar
                    dataKey="d30"
                    name="30-day"
                    minPointSize={4}
                    radius={[10, 10, 4, 4]}
                    fill="url(#barGrad30d)"
                    isAnimationActive={false}
                    onClick={(_, i) => {
                      const row = rows[i];
                      if (row) openRepo(row.repo);
                    }}
                  >
                    {rows.map((row, i) => (
                      <Cell
                        key={row.name}
                        cursor="pointer"
                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                )}

                {mode === '7d' && (
                  <Bar
                    dataKey="d7"
                    name="7-day"
                    minPointSize={4}
                    radius={[10, 10, 4, 4]}
                    fill="url(#barGrad7d)"
                    isAnimationActive={false}
                    onClick={(_, i) => {
                      const row = rows[i];
                      if (row) openRepo(row.repo);
                    }}
                  >
                    {rows.map((row, i) => (
                      <Cell
                        key={row.name}
                        cursor="pointer"
                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                )}

                {mode === 'both' && (
                  <Bar
                    dataKey="likes"
                    name="Likes"
                    minPointSize={4}
                    radius={[10, 10, 4, 4]}
                    fill="url(#barGradLikes)"
                    isAnimationActive={false}
                    onClick={(_, i) => {
                      const row = rows[i];
                      if (row) openRepo(row.repo);
                    }}
                  >
                    {rows.map((row, i) => (
                      <Cell
                        key={row.name}
                        cursor="pointer"
                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* Mountain Ridge & Mountain Peaks Area Canvas */
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={rows}
                margin={{ top: 12, right: 12, bottom: 0, left: -14 }}
                onMouseMove={(state) => {
                  const next =
                    typeof state.activeTooltipIndex === 'number'
                      ? state.activeTooltipIndex
                      : null;
                  setActiveIndex(next);
                }}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(state) => {
                  const idx = state?.activeTooltipIndex;
                  if (typeof idx === 'number' && rows[idx]) {
                    openRepo(rows[idx].repo);
                  }
                }}
              >
                <defs>
                  {/* Mountain Lifetime Ridge Gradient */}
                  <linearGradient id="mountainLifetime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.62} />
                    <stop offset="45%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.01} />
                  </linearGradient>

                  {/* Mountain 30-Day Ridge Gradient */}
                  <linearGradient id="mountain30d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.72} />
                    <stop offset="50%" stopColor="var(--color-chart-2)" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.01} />
                  </linearGradient>

                  {/* Mountain 7-Day Ridge Gradient */}
                  <linearGradient id="mountain7d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.72} />
                    <stop offset="50%" stopColor="var(--color-chart-4)" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0.01} />
                  </linearGradient>

                  {/* Mountain Likes Gradient */}
                  <linearGradient id="mountainLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.65} />
                    <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="short"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
                  tickCount={5}
                  scale={logScale ? 'log' : 'auto'}
                  domain={logScale ? [0.5, 'auto'] : [0, 'auto']}
                  allowDataOverflow={false}
                  tickFormatter={(v: number) => (v < 1 ? '0' : formatCompact(v))}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--color-chart-1)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  content={
                    <MountainTooltip
                      activeMode={mode}
                      summitLeader={summitLeader}
                    />
                  }
                />

                {/* Lifetime Mountain Silhouette */}
                {(mode === 'lifetime' || mode === 'both') && (
                  <Area
                    type={chartStyle === 'mountain' ? 'monotone' : 'linear'}
                    dataKey="lifetime"
                    name="Lifetime"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.6}
                    fill="url(#mountainLifetime)"
                    isAnimationActive={false}
                    dot={{
                      r: 3.5,
                      fill: 'var(--color-chart-1)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: 'var(--color-chart-1)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2.5,
                      className: 'cursor-pointer animate-pulse',
                    }}
                  />
                )}

                {/* 30-Day Mountain Ridge */}
                {(mode === '30d' || mode === 'both') && (
                  <Area
                    type={chartStyle === 'mountain' ? 'monotone' : 'linear'}
                    dataKey="d30"
                    name="30-day"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2.2}
                    fill="url(#mountain30d)"
                    isAnimationActive={false}
                    dot={{
                      r: 3,
                      fill: 'var(--color-chart-2)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 1.8,
                    }}
                    activeDot={{
                      r: 5.5,
                      fill: 'var(--color-chart-2)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                      className: 'cursor-pointer',
                    }}
                  />
                )}

                {/* 7-Day Mountain Ridge */}
                {mode === '7d' && (
                  <Area
                    type={chartStyle === 'mountain' ? 'monotone' : 'linear'}
                    dataKey="d7"
                    name="7-day"
                    stroke="var(--color-chart-4)"
                    strokeWidth={2.2}
                    fill="url(#mountain7d)"
                    isAnimationActive={false}
                    dot={{
                      r: 3,
                      fill: 'var(--color-chart-4)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 1.8,
                    }}
                    activeDot={{
                      r: 5.5,
                      fill: 'var(--color-chart-4)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                      className: 'cursor-pointer',
                    }}
                  />
                )}

                {/* Community Likes Crest */}
                {mode === 'both' && (
                  <Area
                    type={chartStyle === 'mountain' ? 'monotone' : 'linear'}
                    dataKey="likes"
                    name="Likes"
                    stroke="var(--color-chart-3)"
                    strokeWidth={1.8}
                    fill="url(#mountainLikes)"
                    isAnimationActive={false}
                    dot={{
                      r: 2.5,
                      fill: 'var(--color-chart-3)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 4.5,
                      fill: 'var(--color-chart-3)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                      className: 'cursor-pointer',
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )
        ) : (
          /* Trend Area Chart */
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={snapshots}
              margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
            >
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="at"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
                tickFormatter={(iso: string) =>
                  new Date(iso).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-ink-3)', fontSize: 11 }}
                tickCount={5}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <Tooltip cursor={false} content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="totalAllTime"
                stroke="var(--color-chart-1)"
                strokeWidth={2.4}
                fill="url(#trendFill)"
                dot={false}
                activeDot={{ r: 4.5, fill: 'var(--color-chart-1)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Screen-reader equivalent table */}
      <table className="sr-only-table">
        <caption>Downloads by repository, lifetime versus last 30 days</caption>
        <thead>
          <tr>
            <th scope="col">Repository</th>
            <th scope="col">Lifetime downloads</th>
            <th scope="col">Downloads in the last 30 days</th>
            <th scope="col">Downloads in the last 7 days</th>
            <th scope="col">Likes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td>{row.lifetime === null ? 'unavailable' : formatFull(row.lifetime)}</td>
              <td>{formatFull(row.d30)}</td>
              <td>{formatFull(row.d7)}</td>
              <td>{formatFull(row.likes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function TabButton({
  active,
  label,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={title ?? label}
      disabled={disabled}
      onClick={onClick}
      className="seg-item seg-icon"
    >
      {children}
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full shadow-xs"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Row;
}

function MountainTooltip({
  active,
  payload,
  activeMode,
  summitLeader,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  activeMode?: Mode;
  summitLeader?: number;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const currentVal =
    activeMode === '30d'
      ? row.d30
      : activeMode === '7d'
        ? row.d7
        : row.lifetime ?? 0;

  const summitRatio =
    summitLeader && summitLeader > 0 ? (currentVal / summitLeader) * 100 : null;

  return (
    <div className="min-w-[200px] rounded-[16px] border border-border bg-surface/95 backdrop-blur-md px-4 py-3 shadow-[0_18px_40px_-14px_rgba(26,31,27,.3)]">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <p className="truncate text-[12.5px] font-bold text-ink">{row.name}</p>
        {summitRatio !== null && (
          <span className="shrink-0 rounded-md bg-jade-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-jade-700">
            {summitRatio >= 99 ? '🏔️ Apex' : `${Math.round(summitRatio)}% Summit`}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {(activeMode === 'lifetime' || activeMode === 'both') && (
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--color-chart-1)]"
              />
              Lifetime Peak
            </span>
            <span className="num text-[12px] font-bold text-ink">
              {row.lifetime === null ? '—' : formatFull(row.lifetime)}
            </span>
          </div>
        )}

        {(activeMode === '30d' || activeMode === 'both') && (
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--color-chart-2)]"
              />
              30-day Velocity
            </span>
            <span className="num text-[12px] font-bold text-ink">
              {formatFull(row.d30)}
            </span>
          </div>
        )}

        {activeMode === '7d' && (
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--color-chart-4)]"
              />
              7-day Velocity
            </span>
            <span className="num text-[12px] font-bold text-ink">
              {formatFull(row.d7)}
            </span>
          </div>
        )}

        {activeMode === 'both' && (
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--color-chart-3)]"
              />
              Community Likes
            </span>
            <span className="num text-[12px] font-bold text-ink">
              {formatFull(row.likes)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Snapshot }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="min-w-[170px] rounded-[16px] border border-border bg-surface/95 px-4 py-3 shadow-[0_18px_40px_-14px_rgba(26,31,27,.3)] backdrop-blur-md">
      <p className="mb-2 text-[12px] font-semibold text-ink">
        {new Date(point.at).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
      <div className="flex items-center justify-between gap-4 py-0.5">
        <span className="text-[11.5px] text-ink-3">Lifetime</span>
        <span className="num text-[11.5px] font-bold text-ink">
          {formatFull(point.totalAllTime)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 py-0.5">
        <span className="text-[11.5px] text-ink-3">30-day</span>
        <span className="num text-[11.5px] font-bold text-ink">
          {formatFull(point.total30d)}
        </span>
      </div>
    </div>
  );
}
