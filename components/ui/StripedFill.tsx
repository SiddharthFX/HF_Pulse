/**
 * Diagonal hatch fills (§5.2, §8).
 *
 * Two flavours, because Recharts paints SVG and the DOM elements don't:
 *  - <HatchDefs/> registers SVG <pattern>s referenced as fill="url(#hatch-jade-500)"
 *  - the `.hatch` utility in globals.css layers a repeating-linear-gradient
 *    over a solid background for progress bars, segments and the org card.
 *
 * Both are 45°, 3px stripe / 5px gap, matching the reference artwork.
 */

export const HATCH_IDS = {
  jade500: 'hatch-jade-500',
  jade400: 'hatch-jade-400',
  jade300: 'hatch-jade-300',
  jade200: 'hatch-jade-200',
  clay: 'hatch-clay',
  lime: 'hatch-lime',
} as const;

const PATTERNS: ReadonlyArray<{ id: string; base: string; stripe: string }> = [
  { id: HATCH_IDS.jade500, base: 'var(--color-jade-500)', stripe: 'rgba(255,255,255,.26)' },
  { id: HATCH_IDS.jade400, base: 'var(--color-jade-400)', stripe: 'rgba(255,255,255,.28)' },
  { id: HATCH_IDS.jade300, base: 'var(--color-jade-300)', stripe: 'rgba(255,255,255,.32)' },
  { id: HATCH_IDS.jade200, base: 'var(--color-jade-200)', stripe: 'rgba(255,255,255,.38)' },
  { id: HATCH_IDS.clay, base: 'var(--color-clay)', stripe: 'rgba(255,255,255,.32)' },
  { id: HATCH_IDS.lime, base: 'var(--color-lime)', stripe: 'rgba(255,255,255,.36)' },
];

/** Drop once inside any SVG (or Recharts <defs> slot) before referencing a pattern. */
export function HatchDefs() {
  return (
    <defs>
      {PATTERNS.map(({ id, base, stripe }) => (
        <pattern
          key={id}
          id={id}
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={8} height={8} fill={base} />
          <rect width={3} height={8} fill={stripe} />
        </pattern>
      ))}
    </defs>
  );
}

export function hatchUrl(id: string): string {
  return `url(#${id})`;
}

/** Ordered, theme-aware chart ramp: Sage -> Eucalyptus -> Sand -> Dusk blue -> Moss -> Terracotta -> Lavender */
export const RAMP = [
  { solid: 'var(--color-chart-1)', hatch: HATCH_IDS.jade500 },
  { solid: 'var(--color-chart-2)', hatch: HATCH_IDS.jade400 },
  { solid: 'var(--color-chart-3)', hatch: HATCH_IDS.clay },
  { solid: 'var(--color-chart-4)', hatch: HATCH_IDS.jade300 },
  { solid: 'var(--color-chart-5)', hatch: HATCH_IDS.lime },
  { solid: 'var(--color-chart-6)', hatch: HATCH_IDS.clay },
  { solid: 'var(--color-chart-7)', hatch: HATCH_IDS.jade200 },
] as const;

export const OTHER_COLOR = 'var(--color-border-2)';

export function rampAt(index: number): { solid: string; hatch: string } {
  return RAMP[index % RAMP.length] ?? RAMP[0];
}
