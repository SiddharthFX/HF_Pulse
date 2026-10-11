import 'server-only';

import { getDatasets, getModels, getOrgOverview } from '@/lib/hf/queries';
import { downloads30d, totalDownloadsAllTime } from '@/lib/hf/derive';
import { canShowTrend, getSnapshots, recordSnapshot } from '@/lib/hf/snapshots';
import { usingFixtures } from '@/lib/hf/fixtures';
import type { DashboardPayload } from '@/types/hf';

/**
 * Single source of truth for what the page renders and what /api/hf serves,
 * so the JSON export can never drift from the UI.
 *
 * Both collections are fetched in parallel and failures are scoped: if models
 * fail but datasets succeed, the datasets still render and the models section
 * shows its own error (§5.9).
 */
export async function buildDashboardPayload(): Promise<DashboardPayload> {
  const [org, modelsResult, datasetsResult] = await Promise.all([
    getOrgOverview(),
    getModels(),
    getDatasets(),
  ]);

  const all = [...modelsResult.repos, ...datasetsResult.repos];

  // Only record an observation when we actually have data — otherwise a failed
  // fetch would push a misleading zero into the trend buffer.
  if (all.length > 0) {
    recordSnapshot(totalDownloadsAllTime(all).value, downloads30d(all));
  }

  return {
    org,
    models: modelsResult.repos,
    datasets: datasetsResult.repos,
    modelsError: modelsResult.error,
    datasetsError: datasetsResult.error,
    fetchedAt: new Date().toISOString(),
    snapshots: getSnapshots(),
    canShowTrend: canShowTrend(),
    isFixture: usingFixtures(),
  };
}
