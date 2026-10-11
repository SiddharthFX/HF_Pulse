/** The one and only organization this dashboard reports on. Not user input. */
export const ORG = 'Pluto-AI-Labs' as const;

export const ORG_DISPLAY_NAME = 'Pluto AI Labs' as const;

export const HF_BASE = 'https://huggingface.co' as const;

export const ORG_URL = `${HF_BASE}/${ORG}` as const;

/** 12 hours, in seconds. Used for both fetch-level and route-segment revalidation. */
export const REVALIDATE_SECONDS = 43_200;

/** Data older than this shows the stale-data ribbon (§5.9). */
export const STALE_AFTER_MS = 13 * 60 * 60 * 1000;

/** Client-side floor between manual refreshes (§3.5). */
export const REFRESH_COOLDOWN_MS = 30_000;

/** Max repositories requested per collection. */
export const PAGE_LIMIT = 100;

/** Cache tag revalidated by POST /api/revalidate. */
export const HF_CACHE_TAG = 'hf' as const;

/** Repos below this share of lifetime downloads collapse into "Other". */
export const DISTRIBUTION_OTHER_THRESHOLD = 0.03;

/** Tier-2 observed-trend buffer (§4.4). */
export const SNAPSHOT_MAX = 30;
export const SNAPSHOT_MIN_FOR_TREND = 3;

/** Default storage reference target: 50 GB in bytes. User-overridable via localStorage. */
export const DEFAULT_STORAGE_TARGET_BYTES = 50 * 1024 ** 3;

export const LS_KEYS = {
  sidebarCollapsed: 'pluto.sidebar.collapsed',
  promoDismissed: 'pluto.promo.dismissed',
  storageTarget: 'pluto.storage.target',
  modelsView: 'pluto.models.view',
  datasetsView: 'pluto.datasets.view',
  logScale: 'pluto.chart.logscale',
  compactNumbers: 'pluto.format.compact',
  theme: 'pluto.theme',
} as const;
