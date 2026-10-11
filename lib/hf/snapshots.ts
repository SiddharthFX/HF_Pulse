import 'server-only';

import { SNAPSHOT_MAX, SNAPSHOT_MIN_FOR_TREND } from '@/lib/constants';
import type { Snapshot } from '@/types/hf';

/**
 * Tier 2 of the growth visualization (§4.4).
 *
 * The Hugging Face public API exposes NO per-day historical download counts.
 * Rather than invent a time series, we record what we actually observe: one
 * point per server-side revalidation, held in module scope.
 *
 * This is explicitly NOT historical Hub data. It starts empty on every cold
 * start and is lost on redeploy — the UI says so, in the card footnote.
 *
 * Tier 3 (seeding / interpolating / randomizing) is never implemented.
 */

const buffer: Snapshot[] = [];

/**
 * Appends an observation. De-duplicates when the totals are unchanged from the
 * previous entry, so a burst of revalidations can't fake a dense series.
 */
export function recordSnapshot(totalAllTime: number, total30d: number): void {
  const previous = buffer[buffer.length - 1];
  if (
    previous &&
    previous.totalAllTime === totalAllTime &&
    previous.total30d === total30d
  ) {
    return;
  }

  buffer.push({
    at: new Date().toISOString(),
    totalAllTime,
    total30d,
  });

  // Ring behaviour: keep only the most recent SNAPSHOT_MAX observations.
  while (buffer.length > SNAPSHOT_MAX) buffer.shift();
}

export function getSnapshots(): Snapshot[] {
  return [...buffer];
}

/** The "Observed trend" tab stays disabled until we hold real observations. */
export function canShowTrend(): boolean {
  return buffer.length >= SNAPSHOT_MIN_FOR_TREND;
}
