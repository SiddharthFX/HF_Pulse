import { z } from 'zod';

/**
 * Every object is .passthrough() and every optional scalar is .catch()-guarded
 * so a single unexpected or malformed field can never blank the dashboard (§3.4).
 */

const optNumber = z.number().optional().catch(undefined);
const optString = z.string().optional().catch(undefined);
/** HF returns null (not just absent) for pipeline_tag / library_name. */
const nullishString = z
  .string()
  .nullish()
  .transform((v) => v ?? undefined)
  .catch(undefined);

const CardDataSchema = z
  .object({
    task_categories: z.array(z.string()).optional().catch(undefined),
    license: z.union([z.string(), z.array(z.string())]).optional().catch(undefined),
    language: z.union([z.string(), z.array(z.string())]).optional().catch(undefined),
  })
  .passthrough()
  .optional()
  .catch(undefined);

/**
 * Shared shape for /api/models and /api/datasets. Datasets simply never carry
 * pipeline_tag or library_name, which is why both are optional here.
 *
 * `id` is the only required field — an item without it is unusable and gets
 * dropped by parseRepoList rather than failing the whole response.
 */
export const HfRepoSchema = z
  .object({
    id: z.string(),
    author: optString,
    /** Downloads in the last 30 days. NOT lifetime. */
    downloads: optNumber,
    /** Lifetime downloads. Only returned when requested via expand[]. */
    downloadsAllTime: optNumber,
    likes: optNumber,
    lastModified: optString,
    createdAt: optString,
    pipeline_tag: nullishString,
    library_name: nullishString,
    tags: z.array(z.string()).optional().catch(undefined),
    /** Repository size in bytes. */
    usedStorage: optNumber,
    private: z.boolean().optional().catch(undefined),
    /** false | "auto" | "manual" */
    gated: z.union([z.boolean(), z.string()]).optional().catch(undefined),
    cardData: CardDataSchema,
  })
  .passthrough();

export type HfRepo = z.infer<typeof HfRepoSchema>;

export const OrgOverviewSchema = z
  .object({
    name: optString,
    fullname: optString,
    avatarUrl: optString,
    numModels: optNumber,
    numDatasets: optNumber,
    type: optString,
  })
  .passthrough();

export type HfOrgOverview = z.infer<typeof OrgOverviewSchema>;

/**
 * Parses a repo list item-by-item. One malformed entry is skipped; it never
 * takes the rest of the collection with it. Returns [] for a non-array body.
 */
export function parseRepoList(raw: unknown): HfRepo[] {
  if (!Array.isArray(raw)) return [];
  const out: HfRepo[] = [];
  for (const item of raw) {
    const parsed = HfRepoSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export function parseOrgOverview(raw: unknown): HfOrgOverview | null {
  const parsed = OrgOverviewSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
