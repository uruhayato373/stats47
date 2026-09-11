import { WATER_QUALITY_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseWaterQualitySnapshot } from '../lib/water-quality-snapshot';

import { ThemeWaterQualityClient } from './ThemeWaterQualityClient';
export async function ThemeWaterQualitySection() {
  const raw = await fetchFromR2AsJson<unknown>(
    WATER_QUALITY_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = parseWaterQualitySnapshot(raw);
  return snapshot ? (
    <ThemeWaterQualityClient snapshot={snapshot} />
  ) : (
    <ChartPanel title="水域ごとの水質と基準達成">
      <p className="text-sm text-muted-foreground" role="status">
        現在、確認済みの水質データを取得できません。
      </p>
    </ChartPanel>
  );
}
