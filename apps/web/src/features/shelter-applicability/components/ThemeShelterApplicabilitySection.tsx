
import { SHELTER_APPLICABILITY_SOURCE as source } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseShelterApplicabilitySnapshot } from '../lib/shelter-applicability-snapshot';

import { ThemeShelterApplicabilityClient } from './ThemeShelterApplicabilityClient';

export async function ThemeShelterApplicabilitySection() {
  const raw = await fetchFromR2AsJson<unknown>(source.r2Key).catch(() => null);
  const snapshot = parseShelterApplicabilitySnapshot(raw);
  if (!snapshot)
    return (
      <div
        data-theme-component-key="shelter-applicability"
        data-data-state="unavailable"
      >
        <ChartPanel title="災害の種類と指定緊急避難場所">
          <p role="status" className="text-sm text-muted-foreground">
            現在、確認済みのデータを取得できません。
          </p>
        </ChartPanel>
      </div>
    );
  return <ThemeShelterApplicabilityClient snapshot={snapshot} />;
}
