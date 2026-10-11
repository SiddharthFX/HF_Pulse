'use client';

import { LS_KEYS } from '@/lib/constants';
import { useShell } from '@/components/shell/ShellContext';
import { RepoSection } from '@/components/widgets/RepoSection';
import type { FetchFailure, RepoView } from '@/types/hf';

export function ModelsSection({
  models,
  error,
  index = 0,
}: {
  models: RepoView[];
  error: FetchFailure | null;
  index?: number;
}) {
  // The sidebar's "Tasks" item regroups this grid by pipeline_tag.
  const { groupModelsByTask } = useShell();

  return (
    <RepoSection
      id="models"
      title="Models"
      subtitle="Public models, sorted by lifetime downloads reported by the Hub."
      kind="model"
      repos={models}
      error={error}
      viewStorageKey={LS_KEYS.modelsView}
      groupByTask={groupModelsByTask}
      index={index}
    />
  );
}
