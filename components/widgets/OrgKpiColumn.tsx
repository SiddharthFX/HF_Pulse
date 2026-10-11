import { formatCompact, formatPct } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import type { DerivedStats } from '@/types/hf';

/**
 * Three stacked KPIs. Deltas are the honest part: a coloured ↗ only appears
 * where a genuine comparison exists. Everywhere else this renders a neutral
 * dot glyph and grey text (§5.5b) — never a green arrow beside a number that
 * has nothing to be compared against.
 */
export function OrgKpiColumn({
  stats,
  index = 0,
}: {
  stats: DerivedStats;
  index?: number;
}) {
  const lifetime = stats.totalDownloadsAllTime;
  const shareOfLifetime =
    lifetime.value > 0 ? stats.downloads30d / lifetime.value : null;

  return (
    <Card index={index} className="flex flex-col justify-between p-6">
      <Kpi
        label="Total downloads"
        value={formatCompact(lifetime.value)}
        superscript={lifetime.isPartial ? '*' : undefined}
        superscriptTitle={
          lifetime.isPartial
            ? `Lifetime data unavailable for ${lifetime.missingCount} ${
                lifetime.missingCount === 1 ? 'repository' : 'repositories'
              }`
            : undefined
        }
        note="lifetime"
      />

      <Divider />

      <Kpi
        label="Last 30 days"
        value={formatCompact(stats.downloads30d)}
        note={
          shareOfLifetime === null
            ? 'no lifetime data to compare'
            : `${formatPct(shareOfLifetime)} of lifetime`
        }
      />

      <Divider />

      <Kpi
        label="Total likes"
        value={formatCompact(stats.totalLikes)}
        note={`across ${stats.repoCount.total} ${
          stats.repoCount.total === 1 ? 'repository' : 'repositories'
        }`}
      />
    </Card>
  );
}

function Divider() {
  return <div aria-hidden="true" className="my-5 h-px bg-border" />;
}

function Kpi({
  label,
  value,
  note,
  superscript,
  superscriptTitle,
}: {
  label: string;
  value: string;
  note: string;
  superscript?: string;
  superscriptTitle?: string;
}) {
  return (
    <div>
      <p className="text-[13px] text-ink-3">{label}</p>
      <p className="num mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink max-[1599px]:text-[27px]">
        {value}
        {superscript ? (
          <span className="ml-0.5 align-super text-[13px] text-ink-3" title={superscriptTitle}>
            {superscript}
          </span>
        ) : null}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
        {/* Neutral glyph — no fabricated direction. */}
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-border-2" />
        {note}
      </p>
    </div>
  );
}
