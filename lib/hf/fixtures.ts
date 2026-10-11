import { toRepoViews } from '@/lib/hf/transform';
import type { HfRepo } from '@/lib/hf/schemas';
import type { RepoView } from '@/types/hf';

/**
 * DEV-ONLY offline render path.
 *
 * Active only when NODE_ENV !== 'production' AND HF_FIXTURES=1. In any
 * production build `usingFixtures()` is statically false, so these payloads
 * never reach a deployed UI.
 *
 * The numbers below are deliberately round and obviously synthetic, and the
 * dashboard renders a loud amber "FIXTURE DATA" banner whenever this path is
 * live — so fixture output can never be mistaken for real Hub data.
 *
 * This exists to let you lay out and review the UI without network access.
 * It is NOT a fallback: a real API failure shows an error state (§5.9),
 * it does not silently swap in fixtures.
 */
export function usingFixtures(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.HF_FIXTURES === '1';
}

const FIXTURE_MODELS: HfRepo[] = [
  {
    id: 'Pluto-AI-Labs/fixture-base-7b',
    downloads: 12_000,
    downloadsAllTime: 250_000,
    likes: 40,
    usedStorage: 14 * 1024 ** 3,
    pipeline_tag: 'text-generation',
    library_name: 'transformers',
    tags: ['text-generation', 'pytorch'],
    lastModified: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    createdAt: '2025-01-10T00:00:00.000Z',
    private: false,
    gated: false,
  },
  {
    id: 'Pluto-AI-Labs/fixture-embed-small',
    downloads: 8_000,
    downloadsAllTime: 120_000,
    likes: 25,
    usedStorage: 480 * 1024 ** 2,
    pipeline_tag: 'feature-extraction',
    library_name: 'sentence-transformers',
    tags: ['feature-extraction'],
    lastModified: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    createdAt: '2025-02-01T00:00:00.000Z',
    private: false,
    gated: false,
  },
  {
    id: 'Pluto-AI-Labs/fixture-vision-tagger',
    downloads: 3_000,
    // Deliberately missing downloadsAllTime — exercises the isPartial path
    // and the "—" rendering for absent lifetime data.
    likes: 12,
    usedStorage: 2 * 1024 ** 3,
    pipeline_tag: 'image-classification',
    library_name: 'timm',
    tags: ['image-classification'],
    lastModified: new Date(Date.now() - 45 * 86_400_000).toISOString(),
    createdAt: '2024-11-05T00:00:00.000Z',
    private: false,
    gated: 'auto',
  },
  {
    id: 'Pluto-AI-Labs/fixture-asr-tiny',
    downloads: 900,
    downloadsAllTime: 30_000,
    likes: 6,
    // Deliberately missing usedStorage.
    pipeline_tag: undefined,
    tags: ['automatic-speech-recognition'],
    lastModified: new Date(Date.now() - 200 * 86_400_000).toISOString(),
    createdAt: '2024-06-01T00:00:00.000Z',
    private: false,
    gated: false,
  },
];

const FIXTURE_DATASETS: HfRepo[] = [
  {
    id: 'Pluto-AI-Labs/fixture-instruct-corpus',
    downloads: 5_000,
    downloadsAllTime: 90_000,
    likes: 18,
    usedStorage: 6 * 1024 ** 3,
    tags: ['task_categories:text-generation', 'modality:text'],
    cardData: { task_categories: ['text-generation'] },
    lastModified: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    createdAt: '2025-03-01T00:00:00.000Z',
    private: false,
    gated: false,
  },
  {
    id: 'Pluto-AI-Labs/fixture-eval-suite',
    downloads: 400,
    downloadsAllTime: 4_000,
    likes: 3,
    usedStorage: 120 * 1024 ** 2,
    // No cardData.task_categories — falls through to the modality: tag.
    tags: ['modality:tabular'],
    lastModified: new Date(Date.now() - 95 * 86_400_000).toISOString(),
    createdAt: '2024-09-01T00:00:00.000Z',
    private: false,
    gated: false,
  },
];

export function getFixtureModels(): RepoView[] {
  return toRepoViews(FIXTURE_MODELS, 'model');
}

export function getFixtureDatasets(): RepoView[] {
  return toRepoViews(FIXTURE_DATASETS, 'dataset');
}
