'use client';

import { useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCompact, formatPct } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/Card';
import { RangeSelect } from '@/components/ui/RangeSelect';
import { OTHER_COLOR, rampAt } from '@/components/ui/StripedFill';
import { downloadShare } from '@/lib/hf/derive';
import { useShell } from '@/components/shell/ShellContext';
import type { RepoView } from '@/types/hf';

type Scope = 'all' | 'models' | 'datasets';
type ChartView = 'bar' | 'pie';

const SCOPES = [
  { value: 'all' as const, label: 'All' },
  { value: 'models' as const, label: 'Models' },
  { value: 'datasets' as const, label: 'Datasets' },
];

export function DownloadDistributionCard({
  models,
  datasets,
  index = 0,
}: {
  models: RepoView[];
  datasets: RepoView[];
  index?: number;
}) {
  const { openRepo } = useShell();
  const [scope, setScope] = useState<Scope>('all');
  const [hovered, setHovered] = useState<string | null>(null);
  const [chartView, setChartView] = useState<ChartView>('bar');
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(
    undefined,
  );

  const slices = useMemo(() => {
    const source =
      scope === 'models' ? models : scope === 'datasets' ? datasets : [...models, ...datasets];
    return downloadShare(source);
  }, [scope, models, datasets]);

  const total = slices.reduce((acc, s) => acc + s.value, 0);

  return (
    <Card index={index} className="flex flex-col p-4 sm:p-6">
      <CardHeader
        title="Download distribution"
        subtitle="Share of lifetime downloads"
        action={
          <div className="flex items-center gap-2">
            <RangeSelect
              label="Scope"
              value={scope}
              options={SCOPES}
              onChange={setScope}
            />
            <div className="flex h-11 items-center gap-0.5 rounded-[var(--radius-inner)] border border-border p-0.5 sm:h-8">
              <ChartToggleButton
                active={chartView === 'bar'}
                label="Bar view"
                onClick={() => setChartView('bar')}
              >
                <BarChart3 aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
              </ChartToggleButton>
              <ChartToggleButton
                active={chartView === 'pie'}
                label="Pie view"
                onClick={() => setChartView('pie')}
              >
                <PieIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
              </ChartToggleButton>
            </div>
          </div>
        }
      />

      <p className="num mt-4 text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink">
        {formatCompact(total)}
      </p>

      {slices.length === 0 ? (
        <p className="mt-5 text-[12.5px] text-ink-3">
          No lifetime download data available for this selection.
        </p>
      ) : chartView === 'bar' ? (
        <>
          <div className="mt-5 flex h-9 w-full items-stretch gap-0.5 sm:h-[26px]">
            {slices.map((slice, i) => {
              const color = slice.isOther ? OTHER_COLOR : rampAt(i).solid;
              const isHovered = hovered === slice.key;
              return (
                <button
                  key={slice.key}
                  type="button"
                  aria-label={`${slice.label}: ${formatPct(slice.share)}`}
                  disabled={!slice.repo}
                  onMouseEnter={() => setHovered(slice.key)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(slice.key)}
                  onBlur={() => setHovered(null)}
                  onClick={(event) =>
                    slice.repo && openRepo(slice.repo, event.currentTarget)
                  }
                  className={cn(
                    'h-full min-w-[6px] rounded-[6px] shadow-xs',
                    'transition-all duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)]',
                    isHovered && '-translate-y-0.5 shadow-md brightness-110',
                    !slice.repo && 'cursor-default',
                  )}
                  style={{
                    width: `${Math.max(slice.share * 100, 1.5)}%`,
                    backgroundColor: color,
                  }}
                />
              );
            })}
          </div>

          <ul className="mt-4 flex-1">
            {slices.map((slice, i) => {
              const color = slice.isOther ? OTHER_COLOR : rampAt(i).solid;
              const isHovered = hovered === slice.key;
              return (
                <li key={slice.key}>
                  <button
                    type="button"
                    disabled={!slice.repo}
                    onMouseEnter={() => setHovered(slice.key)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(event) =>
                    slice.repo && openRepo(slice.repo, event.currentTarget)
                  }
                    className={cn(
                      'flex min-h-10 w-full items-center justify-between gap-3 rounded-[8px] px-2 sm:h-7 sm:min-h-0 sm:px-1.5',
                      'transition-colors duration-[140ms]',
                      isHovered && 'bg-surface-2',
                      !slice.repo && 'cursor-default',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate text-[13px] text-ink-2">
                        {slice.label}
                      </span>
                    </span>
                    <span className="num shrink-0 text-[13px] font-medium text-ink">
                      {formatPct(slice.share, 0)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <div className="mt-4 h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="80%"
                  paddingAngle={2}
                  isAnimationActive={false}
                  activeIndex={activePieIndex}
                  activeShape={(props: unknown) => (
                    <ActiveDonutSlice {...(props as PieActiveShapeProps)} />
                  )}
                  onMouseEnter={(_, index) => {
                    setActivePieIndex(index);
                    setHovered(slices[index]?.key ?? null);
                  }}
                  onMouseLeave={() => {
                    setActivePieIndex(undefined);
                    setHovered(null);
                  }}
                  onClick={(_, index, event) => {
                    const slice = slices[index];
                    if (slice?.repo) {
                      const target =
                        event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
                      openRepo(slice.repo, target);
                    }
                  }}
                  cursor={slices.some((slice) => !slice.repo) ? 'default' : 'pointer'}
                >
                  {slices.map((slice, i) => (
                    <Cell
                      key={slice.key}
                      fill={slice.isOther ? OTHER_COLOR : rampAt(i).solid}
                      stroke="var(--color-surface)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-2 flex-1">
            {slices.map((slice, i) => {
              const color = slice.isOther ? OTHER_COLOR : rampAt(i).solid;
              const isHovered = hovered === slice.key;
              return (
                <li key={slice.key}>
                  <button
                    type="button"
                    disabled={!slice.repo}
                    onMouseEnter={() => {
                      setHovered(slice.key);
                      setActivePieIndex(i);
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      setActivePieIndex(undefined);
                    }}
                    onClick={(event) =>
                    slice.repo && openRepo(slice.repo, event.currentTarget)
                  }
                    className={cn(
                      'flex min-h-10 w-full items-center justify-between gap-3 rounded-[8px] px-2 sm:h-7 sm:min-h-0 sm:px-1.5',
                      'transition-colors duration-[140ms]',
                      isHovered && 'bg-surface-2',
                      !slice.repo && 'cursor-default',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate text-[13px] text-ink-2">
                        {slice.label}
                      </span>
                    </span>
                    <span className="num shrink-0 text-[13px] font-medium text-ink">
                      {formatPct(slice.share, 0)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

function ChartToggleButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors duration-[160ms] sm:h-7 sm:w-8',
        active
          ? 'border border-border-2 bg-surface text-ink shadow-[0_1px_2px_rgba(16,20,18,.06)]'
          : 'text-ink-3 hover:text-ink-2',
      )}
    >
      {children}
    </button>
  );
}

interface PieActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

function ActiveDonutSlice({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
}: PieActiveShapeProps) {
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="var(--color-surface)"
      strokeWidth={2}
    />
  );
}

interface PieTooltipPayload {
  name?: string;
  value?: number;
  payload?: { label?: string; value?: number; share?: number };
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: PieTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  if (!item?.payload) return null;

  return (
    <div className="min-w-[140px] rounded-[var(--radius-inner)] border border-border bg-surface px-3.5 py-2.5 shadow-[0_8px_24px_-8px_rgba(16,20,18,.16)]">
      <p className="mb-1.5 truncate text-[12px] font-semibold text-ink">
        {item.payload.label}
      </p>
      <div className="flex items-center justify-between gap-4 py-0.5">
        <span className="text-[11.5px] text-ink-3">Downloads</span>
        <span className="num text-[11.5px] font-semibold text-ink">
          {formatCompact(item.payload.value ?? 0)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 py-0.5">
        <span className="text-[11.5px] text-ink-3">Share</span>
        <span className="num text-[11.5px] font-semibold text-ink">
          {formatPct(item.payload.share ?? 0)}
        </span>
      </div>
    </div>
  );
}
