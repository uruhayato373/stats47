import { BRIDGE_INSPECTION_AGE_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseBridgeInspectionAgeSnapshot } from '../lib/bridge-inspection-age-snapshot';

import { ThemeBridgeInspectionAgeClient } from './ThemeBridgeInspectionAgeClient';

export async function ThemeBridgeInspectionAgeSection() {
  const snapshot = await fetchFromR2AsJson<unknown>(
    BRIDGE_INSPECTION_AGE_SOURCE.r2Key
  )
    .then(parseBridgeInspectionAgeSnapshot)
    .catch(() => null);
  if (!snapshot)
    return (
      <ChartPanel title="当年度点検橋の架設年度分布">
        <p role="status" className="text-sm text-muted-foreground">
          現在、確認済みの架設年度データを取得できません。
        </p>
      </ChartPanel>
    );
  return <ThemeBridgeInspectionAgeClient snapshot={snapshot} />;
}
