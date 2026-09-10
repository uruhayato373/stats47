import { CULTURAL_HERITAGE_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { verifyCulturalHeritageSnapshot } from '../lib/cultural-heritage-snapshot';

import { ThemeCulturalHeritageClient } from './ThemeCulturalHeritageClient';

export async function ThemeCulturalHeritageSection() {
  const raw = await fetchFromR2AsJson<unknown>(
    CULTURAL_HERITAGE_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = await verifyCulturalHeritageSnapshot(raw);
  if (!snapshot)
    return (
      <ChartPanel title="文化財の種類と所在地">
        <p role="status" className="text-sm text-muted-foreground">
          現在、確認済みの文化財所在地データを取得できません。
        </p>
      </ChartPanel>
    );
  return <ThemeCulturalHeritageClient snapshot={snapshot} />;
}
