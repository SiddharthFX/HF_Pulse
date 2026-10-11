import { DISTRIBUTION_OTHER_THRESHOLD } from '@/lib/constants';
import type {
  DerivedStats,
  RepoView,
  ShareSlice,
  TopRepoEntry,
  TotalsResult,
} from '@/types/hf';

/**
 * All arithmetic here is honest over real API fields. Nothing is estimated,
 * interpolated, or seeded. Where a field is missing we report `isPartial`
 * rather than substituting a plausible number.
 */

/** Sums a nullable field, reporting how many repos lacked it. */
function sumNullable(
  repos: RepoView[],
  pick: (r: RepoView) => number | null,
): TotalsResult {
  let value = 0;
  let missingCount = 0;
  for (const r of repos) {
    const v = pick(r);
    if (v === null || !Number.isFinite(v)) missingCount++;
    else value += v;
  }
  return { value, isPartial: missingCount > 0, missingCount };
}

export function totalDownloadsAllTime(repos: RepoView[]): TotalsResult {
  return sumNullable(repos, (r) => r.downloadsAllTime);
}

export function totalStorageBytes(repos: RepoView[]): TotalsResult {
  return sumNullable(repos, (r) => r.usedStorage);
}

export function downloads30d(repos: RepoView[]): number {
  return repos.reduce((acc, r) => acc + r.downloads30d, 0);
}

export function totalLikes(repos: RepoView[]): number {
  return repos.reduce((acc, r) => acc + r.likes, 0);
}

/**
 * 30-day share of lifetime downloads. Deliberately NOT a growth rate — the
 * public API exposes no historical series, so no rate can be computed.
 * Always labelled "30-day share of lifetime" in the UI.
 */
export function momentumPct(repo: RepoView): number {
  const lifetime = repo.downloadsAllTime;
  if (lifetime === null || lifetime <= 0) return 0;
  return repo.downloads30d / lifetime;
}

/**
 * Per-repo share of lifetime downloads, sorted desc, with everything under
 * 3% collapsed into a single "Other" bucket.
 */
export function downloadShare(repos: RepoView[]): ShareSlice[] {
  const total = repos.reduce((acc, r) => acc + (r.downloadsAllTime ?? 0), 0);
  if (total <= 0) return [];

  const sorted = [...repos]
    .filter((r) => (r.downloadsAllTime ?? 0) > 0)
    .sort((a, b) => (b.downloadsAllTime ?? 0) - (a.downloadsAllTime ?? 0));

  const slices: ShareSlice[] = [];
  let otherValue = 0;

  for (const repo of sorted) {
    const value = repo.downloadsAllTime ?? 0;
    const share = value / total;
    if (share < DISTRIBUTION_OTHER_THRESHOLD) {
      otherValue += value;
      continue;
    }
    slices.push({
      key: repo.id,
      label: repo.name,
      value,
      share,
      repo,
      isOther: false,
    });
  }

  if (otherValue > 0) {
    slices.push({
      key: '__other__',
      label: 'Other',
      value: otherValue,
      share: otherValue / total,
      repo: null,
      isOther: true,
    });
  }

  return slices;
}

/**
 * Model downloads as a share of all lifetime downloads. Drives the gauge.
 * null when there is no lifetime data at all to divide by.
 */
export function modelVsDatasetShare(
  models: RepoView[],
  datasets: RepoView[],
): number | null {
  const modelTotal = models.reduce((a, r) => a + (r.downloadsAllTime ?? 0), 0);
  const datasetTotal = datasets.reduce((a, r) => a + (r.downloadsAllTime ?? 0), 0);
  const total = modelTotal + datasetTotal;
  if (total <= 0) return null;
  return modelTotal / total;
}

/**
 * Top N by lifetime downloads, each with progress relative to the leader so
 * the #1 repo's bar renders full.
 */
export function topRepos(repos: RepoView[], limit = 5): TopRepoEntry[] {
  const sorted = [...repos]
    .filter((r) => (r.downloadsAllTime ?? 0) > 0)
    .sort((a, b) => (b.downloadsAllTime ?? 0) - (a.downloadsAllTime ?? 0))
    .slice(0, limit);

  const leader = sorted[0]?.downloadsAllTime ?? 0;

  return sorted.map((repo) => {
    const value = repo.downloadsAllTime ?? 0;
    return {
      repo,
      value,
      progress: leader > 0 ? value / leader : 0,
    };
  });
}

/** All repos merged, most recently modified first. */
export function recentActivity(repos: RepoView[], limit = 8): RepoView[] {
  return [...repos]
    .sort((a, b) => {
      const at = a.lastModified ? Date.parse(a.lastModified) : 0;
      const bt = b.lastModified ? Date.parse(b.lastModified) : 0;
      return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
    })
    .slice(0, limit);
}

export function deriveStats(
  models: RepoView[],
  datasets: RepoView[],
): DerivedStats {
  const all = [...models, ...datasets];

  const lifetime = totalDownloadsAllTime(all);
  const d30 = downloads30d(all);
  const shares = downloadShare(all);

  const leading = shares.find((s) => !s.isOther) ?? null;

  return {
    totalDownloadsAllTime: lifetime,
    downloads30d: d30,
    totalLikes: totalLikes(all),
    totalStorageBytes: totalStorageBytes(all),
    repoCount: {
      models: models.length,
      datasets: datasets.length,
      total: all.length,
    },
    avgDailyDownloads: Math.round(d30 / 30),
    downloadShare: shares,
    modelVsDatasetShare: modelVsDatasetShare(models, datasets),
    topRepos: topRepos(all, 5),
    topModels: topRepos(models, 3),
    topDatasets: topRepos(datasets, 3),
    recentActivity: recentActivity(all, 8),
    updatedLast30d: all.filter((r) => r.ageDays !== null && r.ageDays <= 30).length,
    leadingRepo: leading?.repo ?? null,
    leadingRepoShare: leading?.share ?? null,
  };
}
