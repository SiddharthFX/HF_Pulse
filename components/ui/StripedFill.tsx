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
  { id: HATCH_IDS.jade500, base: '#0FA871', stripe: 'rgba(255,255,255,.34)' },
  { id: HATCH_IDS.jade400, base: '#34C88A', stripe: 'rgba(255,255,255,.34)' },
  { id: HATCH_IDS.jade300, base: '#6FDCA8', stripe: 'rgba(255,255,255,.40)' },
  { id: HATCH_IDS.jade200, base: '#A9EBC9', stripe: 'rgba(255,255,255,.46)' },
  { id: HATCH_IDS.clay, base: '#F0A46A', stripe: 'rgba(255,255,255,.38)' },
  { id: HATCH_IDS.lime, base: '#D8E85C', stripe: 'rgba(255,255,255,.42)' },
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

/** Ordered vibrant color ramp for charts and distribution: Jade -> Cyan -> Indigo -> Amber -> Lime -> Rose -> Sky */
export const RAMP = [
  { solid: '#0FA871', hatch: HATCH_IDS.jade500 },
  { solid: '#06B6D4', hatch: HATCH_IDS.jade400 },
  { solid: '#6366F1', hatch: HATCH_IDS.jade300 },
  { solid: '#F59E0B', hatch: HATCH_IDS.clay },
  { solid: '#84CC16', hatch: HATCH_IDS.lime },
  { solid: '#F43F5E', hatch: HATCH_IDS.clay },
  { solid: '#0EA5E9', hatch: HATCH_IDS.jade200 },
] as const;

export const OTHER_COLOR = 'var(--color-border-2)';

export function rampAt(index: number): { solid: string; hatch: string } {
  return RAMP[index % RAMP.length] ?? RAMP[0];
}
