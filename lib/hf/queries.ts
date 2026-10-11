import 'server-only';

import { ORG, ORG_DISPLAY_NAME, ORG_URL, PAGE_LIMIT, HF_BASE } from '@/lib/constants';
import { buildHubUrl, hfFetch } from '@/lib/hf/client';
import { parseOrgOverview, parseRepoList } from '@/lib/hf/schemas';
import { toRepoViews } from '@/lib/hf/transform';
import { getFixtureDatasets, getFixtureModels, usingFixtures } from '@/lib/hf/fixtures';
import type { FetchFailure, OrgIdentity, RepoView } from '@/types/hf';

/**
 * expand[] must be requested explicitly for downloadsAllTime — without it the
 * Hub returns only `downloads` (the 30-day figure) and lifetime totals would
 * silently read as null across the board.
 */
const MODEL_EXPAND = [
  'downloads',
  'downloadsAllTime',
  'likes',
  'lastModified',
  'createdAt',
  'pipeline_tag',
  'library_name',
  'tags',
  'private',
  'gated',
  'cardData',
] as const;

/** Datasets carry no pipeline_tag or library_name. */
const DATASET_EXPAND = [
  'downloads',
  'downloadsAllTime',
  'likes',
  'lastModified',
  'createdAt',
  'tags',
  'private',
  'gated',
  'cardData',
] as const;

export interface CollectionResult {
  repos: RepoView[];
  error: FetchFailure | null;
}

export async function getModels(): Promise<CollectionResult> {
  if (usingFixtures()) return { repos: getFixtureModels(), error: null };

  const url = buildHubUrl('/api/models', {
    author: ORG,
    limit: PAGE_LIMIT,
    expand: MODEL_EXPAND,
  });

  const result = await hfFetch(url);
  if (!result.ok) return { repos: [], error: result };

  return { repos: toRepoViews(parseRepoList(result.data), 'model'), error: null };
}

export async function getDatasets(): Promise<CollectionResult> {
  if (usingFixtures()) return { repos: getFixtureDatasets(), error: null };

  const url = buildHubUrl('/api/datasets', {
    author: ORG,
    limit: PAGE_LIMIT,
    expand: DATASET_EXPAND,
  });

  const result = await hfFetch(url);
  if (!result.ok) return { repos: [], error: result };

  return { repos: toRepoViews(parseRepoList(result.data), 'dataset'), error: null };
}

const FALLBACK_ORG: OrgIdentity = {
  name: ORG,
  fullName: ORG_DISPLAY_NAME,
  avatarUrl: null,
  url: ORG_URL,
};

/**
 * Best-effort org identity (§3.3). Tries the organization endpoint, then the
 * user endpoint, then falls back to a static identity derived from constants.
 * This function cannot fail — the dashboard must never break because of it.
 */
export async function getOrgOverview(): Promise<OrgIdentity> {
  if (usingFixtures()) return FALLBACK_ORG;

  const endpoints = [
    `${HF_BASE}/api/organizations/${ORG}/overview`,
    `${HF_BASE}/api/users/${ORG}/overview`,
  ];

  for (const endpoint of endpoints) {
    const result = await hfFetch(endpoint);
    if (!result.ok) continue;

    const parsed = parseOrgOverview(result.data);
    if (!parsed) continue;

    return {
      name: parsed.name ?? ORG,
      fullName: parsed.fullname ?? ORG_DISPLAY_NAME,
      avatarUrl: parsed.avatarUrl ?? null,
      url: ORG_URL,
    };
  }

  return FALLBACK_ORG;
}
