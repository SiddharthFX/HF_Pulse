'use client';

import { LS_KEYS } from '@/lib/constants';
import { RepoSection } from '@/components/widgets/RepoSection';
import type { FetchFailure, RepoView } from '@/types/hf';

export function DatasetsSection({
  datasets,
  error,
  index = 0,
}: {
  datasets: RepoView[];
  error: FetchFailure | null;
  index?: number;
}) {
  return (
    <RepoSection
      id="datasets"
      title="Datasets"
      subtitle="Public datasets, sorted by lifetime downloads reported by the Hub."
      kind="dataset"
      repos={datasets}
      error={error}
      viewStorageKey={LS_KEYS.datasetsView}
      index={index}
    />
  );
}
