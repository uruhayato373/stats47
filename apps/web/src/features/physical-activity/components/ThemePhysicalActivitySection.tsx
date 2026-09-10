import { PHYSICAL_ACTIVITY_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parsePhysicalActivitySnapshot } from '../lib/physical-activity-snapshot';

import { ThemePhysicalActivityClient } from './ThemePhysicalActivityClient';

export async function ThemePhysicalActivitySection() {
  const raw = await fetchFromR2AsJson<unknown>(
    PHYSICAL_ACTIVITY_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = parsePhysicalActivitySnapshot(raw);
  if (!snapshot) {
    return (
      <ChartPanel title="歩数と推計の幅">
        <p className="text-sm text-muted-foreground" role="status">
          現在、確認済みの歩数データを取得できません。
        </p>
      </ChartPanel>
    );
  }
  return <ThemePhysicalActivityClient snapshot={snapshot} />;
}
