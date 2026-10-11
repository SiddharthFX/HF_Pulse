/** Which collection a repository belongs to. Drives URL construction and colour. */
export type RepoKind = 'model' | 'dataset';

/** Freshness buckets derived from lastModified (§4). */
export type Freshness = 'Active' | 'Recent' | 'Stable' | 'Dormant';

/**
 * The normalized shape every widget consumes. Produced by lib/hf/transform.ts.
 * Nullable fields are genuinely absent from the API for some repos — the UI
 * must render "—" for them, never 0.
 */
export interface RepoView {
  /** Full repo id, e.g. "Pluto-AI-Labs/tiny-llm". */
  id: string;
  /** Repo id without the org prefix. */
  name: string;
  kind: RepoKind;
  /** Downloads in the LAST 30 DAYS. Never lifetime. */
  downloads30d: number;
  /** LIFETIME downloads. Only present when expand[]=downloadsAllTime is honoured. */
  downloadsAllTime: number | null;
  likes: number;
  /** Repository size in bytes. */
  usedStorage: number | null;
  /** Task slug: pipeline_tag for models, derived for datasets. */
  task: string | null;
  libraryName: string | null;
  tags: string[];
  lastModified: string | null;
  createdAt: string | null;
  private: boolean;
  gated: boolean;
  /** Days since lastModified; null when unparseable. */
  ageDays: number | null;
  freshness: Freshness;
  /** Canonical Hub URL. /{id} for models, /datasets/{id} for datasets. */
  url: string;
}

export interface OrgIdentity {
  name: string;
  fullName: string;
  avatarUrl: string | null;
  url: string;
}

/** One bucket of the download-distribution card. */
export interface ShareSlice {
  key: string;
  label: string;
  value: number;
  share: number;
  /** Absent for the synthetic "Other" bucket. */
  repo: RepoView | null;
  isOther: boolean;
}

export interface TopRepoEntry {
  repo: RepoView;
  value: number;
  /** 0..1 relative to the leading repo, so the leader's bar is full. */
  progress: number;
}

export interface TotalsResult {
  value: number;
  /** True when at least one repo lacked the field being summed. */
  isPartial: boolean;
  missingCount: number;
}

export interface Snapshot {
  at: string;
  totalAllTime: number;
  total30d: number;
}

export interface DerivedStats {
  totalDownloadsAllTime: TotalsResult;
  downloads30d: number;
  totalLikes: number;
  totalStorageBytes: TotalsResult;
  repoCount: { models: number; datasets: number; total: number };
  avgDailyDownloads: number;
  downloadShare: ShareSlice[];
  modelVsDatasetShare: number | null;
  topRepos: TopRepoEntry[];
  topModels: TopRepoEntry[];
  topDatasets: TopRepoEntry[];
  recentActivity: RepoView[];
  updatedLast30d: number;
  leadingRepo: RepoView | null;
  leadingRepoShare: number | null;
}

export type FetchErrorKind = 'rate_limit' | 'network' | 'http' | 'parse';

export interface FetchFailure {
  ok: false;
  error: string;
  kind: FetchErrorKind;
  status: number | null;
}

export type FetchResult<T> = { ok: true; data: T } | FetchFailure;

/** The aggregated payload page.tsx composes and /api/hf serves. */
export interface DashboardPayload {
  org: OrgIdentity;
  models: RepoView[];
  datasets: RepoView[];
  modelsError: FetchFailure | null;
  datasetsError: FetchFailure | null;
  fetchedAt: string;
  snapshots: Snapshot[];
  canShowTrend: boolean;
  isFixture: boolean;
}
