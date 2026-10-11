import { HF_BASE } from '@/lib/constants';
import { daysSince } from '@/lib/format';
import type { HfRepo } from '@/lib/hf/schemas';
import type { Freshness, RepoKind, RepoView } from '@/types/hf';

/** ≤7d Active, ≤30d Recent, ≤90d Stable, >90d Dormant (§4). */
export function bucketFreshness(ageDays: number | null): Freshness {
  if (ageDays === null) return 'Dormant';
  if (ageDays <= 7) return 'Active';
  if (ageDays <= 30) return 'Recent';
  if (ageDays <= 90) return 'Stable';
  return 'Dormant';
}

function stripPrefix(tag: string): string {
  const idx = tag.indexOf(':');
  return idx === -1 ? tag : tag.slice(idx + 1);
}

/**
 * Datasets have no pipeline_tag. Resolve a task label in the §3.2 priority
 * order: cardData.task_categories[0] -> task_categories:* tag ->
 * modality:* tag -> literal "dataset".
 */
export function resolveDatasetTask(repo: HfRepo): string {
  const fromCard = repo.cardData?.task_categories?.[0];
  if (typeof fromCard === 'string' && fromCard.trim()) return fromCard.trim();

  const tags = repo.tags ?? [];

  const taskTag = tags.find((t) => t.startsWith('task_categories:'));
  if (taskTag) {
    const stripped = stripPrefix(taskTag);
    if (stripped) return stripped;
  }

  const modalityTag = tags.find((t) => t.startsWith('modality:'));
  if (modalityTag) {
    const stripped = stripPrefix(modalityTag);
    if (stripped) return stripped;
  }

  return 'dataset';
}

/** gated is `false | "auto" | "manual"` — any truthy non-false value means gated. */
function isGated(gated: boolean | string | undefined): boolean {
  if (typeof gated === 'boolean') return gated;
  if (typeof gated === 'string') return gated !== 'false' && gated.length > 0;
  return false;
}

export function toRepoView(
  repo: HfRepo,
  kind: RepoKind,
  now: number = Date.now(),
): RepoView {
  const name = repo.id.includes('/')
    ? (repo.id.split('/').pop() ?? repo.id)
    : repo.id;

  const lastModified = repo.lastModified ?? null;
  const ageDays = daysSince(lastModified, now);

  const task =
    kind === 'model' ? (repo.pipeline_tag ?? null) : resolveDatasetTask(repo);

  return {
    id: repo.id,
    name,
    kind,
    // `downloads` is the 30-day figure. Absent -> 0 is correct here: the Hub
    // omits it for repos with no recent traffic.
    downloads30d: repo.downloads ?? 0,
    // Absent -> null, NOT 0. A missing lifetime figure must render "—" and be
    // excluded from sums, not silently understate the total.
    downloadsAllTime: repo.downloadsAllTime ?? null,
    likes: repo.likes ?? 0,
    usedStorage: repo.usedStorage ?? null,
    task,
    libraryName: repo.library_name ?? null,
    tags: repo.tags ?? [],
    lastModified,
    createdAt: repo.createdAt ?? null,
    private: repo.private ?? false,
    gated: isGated(repo.gated),
    ageDays,
    freshness: bucketFreshness(ageDays),
    url: kind === 'model' ? `${HF_BASE}/${repo.id}` : `${HF_BASE}/datasets/${repo.id}`,
  };
}

export function toRepoViews(
  repos: HfRepo[],
  kind: RepoKind,
  now: number = Date.now(),
): RepoView[] {
  return repos.map((r) => toRepoView(r, kind, now));
}
